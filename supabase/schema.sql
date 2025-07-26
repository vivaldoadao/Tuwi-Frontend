-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE user_role AS ENUM ('customer', 'braider', 'admin');
CREATE TYPE braider_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE booking_type AS ENUM ('domicilio', 'trancista');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  phone VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Braiders table
CREATE TABLE public.braiders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  bio TEXT,
  location VARCHAR NOT NULL,
  contact_phone VARCHAR,
  status braider_status DEFAULT 'pending',
  portfolio_images TEXT[] DEFAULT '{}',
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT,
  long_description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  images TEXT[] NOT NULL DEFAULT '{}',
  category VARCHAR NOT NULL,
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  braider_id UUID REFERENCES public.braiders(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Braider availability table
CREATE TABLE public.braider_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  braider_id UUID REFERENCES public.braiders(id) ON DELETE CASCADE,
  available_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(braider_id, available_date, start_time)
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT,
  client_id UUID REFERENCES public.users(id) ON DELETE RESTRICT,
  braider_id UUID REFERENCES public.braiders(id) ON DELETE RESTRICT,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  service_type booking_type NOT NULL,
  client_name VARCHAR NOT NULL,
  client_email VARCHAR NOT NULL,
  client_phone VARCHAR NOT NULL,
  client_address TEXT,
  status booking_status DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE RESTRICT,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  status order_status DEFAULT 'pending',
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  payment_id VARCHAR,
  tracking_number VARCHAR,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_per_unit DECIMAL(10,2) NOT NULL CHECK (price_per_unit >= 0),
  product_snapshot JSONB, -- Store product data at time of order
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  braider_id UUID REFERENCES public.braiders(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id) -- One review per booking
);

-- Payment transactions table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  status payment_status DEFAULT 'pending',
  payment_method VARCHAR NOT NULL,
  transaction_id VARCHAR UNIQUE,
  gateway_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK ((order_id IS NOT NULL AND booking_id IS NULL) OR (order_id IS NULL AND booking_id IS NOT NULL))
);

-- Shopping cart table (optional - can also use localStorage)
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.braiders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.braider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Braiders policies
CREATE POLICY "Anyone can view approved braiders" ON public.braiders
  FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Braiders can update their own profile" ON public.braiders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can create braider profile" ON public.braiders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Products policies
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);

-- Services policies
CREATE POLICY "Anyone can view available services" ON public.services
  FOR SELECT USING (is_available = true);

CREATE POLICY "Braiders can manage their own services" ON public.services
  FOR ALL USING (braider_id IN (
    SELECT id FROM public.braiders WHERE user_id = auth.uid()
  ));

-- Availability policies
CREATE POLICY "Anyone can view availability" ON public.braider_availability
  FOR SELECT USING (true);

CREATE POLICY "Braiders can manage their own availability" ON public.braider_availability
  FOR ALL USING (braider_id IN (
    SELECT id FROM public.braiders WHERE user_id = auth.uid()
  ));

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (
    client_id = auth.uid() OR 
    braider_id IN (SELECT id FROM public.braiders WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Braiders can update their bookings" ON public.bookings
  FOR UPDATE USING (braider_id IN (
    SELECT id FROM public.braiders WHERE user_id = auth.uid()
  ));

-- Orders policies
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Order items policies
CREATE POLICY "Users can view their order items" ON public.order_items
  FOR SELECT USING (order_id IN (
    SELECT id FROM public.orders WHERE user_id = auth.uid()
  ));

-- Reviews policies
CREATE POLICY "Anyone can view public reviews" ON public.reviews
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create reviews for their bookings" ON public.reviews
  FOR INSERT WITH CHECK (client_id = auth.uid() AND booking_id IN (
    SELECT id FROM public.bookings WHERE client_id = auth.uid()
  ));

CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE USING (client_id = auth.uid());

-- Payment transactions policies
CREATE POLICY "Users can view their own payment transactions" ON public.payment_transactions
  FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()) OR
    booking_id IN (SELECT id FROM public.bookings WHERE client_id = auth.uid())
  );

-- Cart items policies
CREATE POLICY "Users can manage their own cart" ON public.cart_items
  FOR ALL USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_braiders_status ON public.braiders(status);
CREATE INDEX idx_braiders_user_id ON public.braiders(user_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_services_braider_id ON public.services(braider_id);
CREATE INDEX idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX idx_bookings_braider_id ON public.bookings(braider_id);
CREATE INDEX idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_reviews_braider_id ON public.reviews(braider_id);
CREATE INDEX idx_availability_braider_date ON public.braider_availability(braider_id, available_date);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_braiders_updated_at BEFORE UPDATE ON public.braiders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update braider ratings
CREATE OR REPLACE FUNCTION update_braider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.braiders 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM public.reviews 
      WHERE braider_id = NEW.braider_id AND is_public = true
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM public.reviews 
      WHERE braider_id = NEW.braider_id AND is_public = true
    )
  WHERE id = NEW.braider_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update braider ratings when review is added/updated
CREATE TRIGGER update_braider_rating_trigger
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_braider_rating();

-- Insert sample data
INSERT INTO public.products (name, description, long_description, price, images, category) VALUES
('Trança Box Braids Clássica', 'Cabelo sintético de alta qualidade para um visual clássico e duradouro.', 
 'As Box Braids clássicas são uma escolha atemporal para quem busca um visual elegante e de baixa manutenção.', 
 150.00, ARRAY['/placeholder.svg?height=300&width=400&text=Box+Braids'], 'tranças'),
('Crochet Braids Onduladas', 'Fios ondulados para um estilo volumoso e natural.',
 'Nossas Crochet Braids onduladas são ideais para quem deseja volume e movimento.',
 180.00, ARRAY['/placeholder.svg?height=300&width=400&text=Crochet+Braids'], 'tranças'),
('Twists Senegalesas Longas', 'Twists elegantes e leves, perfeitas para qualquer ocasião.',
 'As Twists Senegalesas longas da Wilnara Tranças são sinônimo de elegância e leveza.',
 220.00, ARRAY['/placeholder.svg?height=300&width=400&text=Twists+Senegalesas'], 'twists');