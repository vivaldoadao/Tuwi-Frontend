-- Order Tracking System Schema
-- This table stores the timeline/history of order status changes and events

CREATE TABLE IF NOT EXISTS order_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type VARCHAR NOT NULL CHECK (event_type IN (
    'order_created',
    'payment_confirmed', 
    'processing_started',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'returned',
    'refunded',
    'note_added'
  )),
  status VARCHAR CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  title VARCHAR NOT NULL,
  description TEXT,
  location VARCHAR, -- For shipping events
  tracking_number VARCHAR, -- Shipping company tracking number
  metadata JSONB, -- Additional event data (courier info, etc.)
  created_by VARCHAR, -- admin user ID or 'system' for automated events
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_event_type ON order_tracking(event_type);
CREATE INDEX IF NOT EXISTS idx_order_tracking_created_at ON order_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_tracking_status ON order_tracking(status);

-- Enable RLS (Row Level Security)
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_tracking
-- Customers can view tracking for their own orders
CREATE POLICY "Customers can view own order tracking" ON order_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_tracking.order_id 
      AND orders.customer_email = auth.jwt() ->> 'email'
    )
  );

-- Admins can view all order tracking
CREATE POLICY "Admins can view all order tracking" ON order_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Only admins and system can insert tracking events
CREATE POLICY "Admins can create tracking events" ON order_tracking
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    OR created_by = 'system'
  );

-- Only admins can update tracking events
CREATE POLICY "Admins can update tracking events" ON order_tracking
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create trigger to automatically create initial tracking event when order is created
CREATE OR REPLACE FUNCTION create_initial_tracking_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO order_tracking (
    order_id,
    event_type,
    status,
    title,
    description,
    created_by,
    created_at
  ) VALUES (
    NEW.id,
    'order_created',
    'pending',
    'Pedido Criado',
    'Seu pedido foi criado com sucesso e está sendo processado.',
    'system',
    NEW.created_at
  );
  
  -- If payment_intent_id exists, add payment confirmation event
  IF NEW.payment_intent_id IS NOT NULL THEN
    INSERT INTO order_tracking (
      order_id,
      event_type,
      status,
      title,
      description,
      created_by,
      created_at
    ) VALUES (
      NEW.id,
      'payment_confirmed',
      'pending',
      'Pagamento Confirmado',
      'Pagamento processado com sucesso via Stripe.',
      'system',
      NEW.created_at + INTERVAL '1 minute'
    );
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_create_initial_tracking
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_tracking_event();

-- Create trigger to automatically add tracking event when order status changes
CREATE OR REPLACE FUNCTION track_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  event_title VARCHAR;
  event_description TEXT;
  event_type_name VARCHAR;
BEGIN
  -- Only proceed if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Set event details based on new status
  CASE NEW.status
    WHEN 'processing' THEN
      event_type_name := 'processing_started';
      event_title := 'Pedido em Processamento';
      event_description := 'Seu pedido está sendo preparado com muito carinho.';
    WHEN 'shipped' THEN
      event_type_name := 'shipped';
      event_title := 'Pedido Enviado';
      event_description := 'Seu pedido foi enviado e está a caminho do destino.';
    WHEN 'delivered' THEN
      event_type_name := 'delivered';
      event_title := 'Pedido Entregue';
      event_description := 'Seu pedido foi entregue com sucesso. Esperamos que goste!';
    WHEN 'cancelled' THEN
      event_type_name := 'cancelled';
      event_title := 'Pedido Cancelado';
      event_description := 'Seu pedido foi cancelado. Entre em contato conosco se tiver dúvidas.';
    ELSE
      RETURN NEW; -- Don't create tracking for unknown status
  END CASE;
  
  -- Insert tracking event
  INSERT INTO order_tracking (
    order_id,
    event_type,
    status,
    title,
    description,
    created_by,
    created_at
  ) VALUES (
    NEW.id,
    event_type_name,
    NEW.status,
    event_title,
    event_description,
    'system',
    NEW.updated_at
  );
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_track_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION track_order_status_change();

-- Sample tracking event types and their descriptions
COMMENT ON TABLE order_tracking IS 'Stores timeline events for order tracking system';
COMMENT ON COLUMN order_tracking.event_type IS 'Type of tracking event: order_created, payment_confirmed, processing_started, shipped, out_for_delivery, delivered, cancelled, returned, refunded, note_added';
COMMENT ON COLUMN order_tracking.metadata IS 'Additional event data in JSON format (courier info, tracking URLs, etc.)';
COMMENT ON COLUMN order_tracking.created_by IS 'ID of admin user who created the event, or "system" for automated events';