"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { useGeolocation, isInPortugal } from '@/hooks/useGeolocation';
import { searchNearbyBraiders, type NearbyBraider } from '@/lib/api-client';
import { toast } from 'react-hot-toast';

interface NearMeButtonProps {
  onResultsFound: (braiders: NearbyBraider[], userLocation: { lat: number; lon: number }) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  radius?: number;
}

export function NearMeButton({ 
  onResultsFound, 
  onError, 
  disabled = false,
  className = "",
  radius = 50
}: NearMeButtonProps) {
  const [isSearching, setIsSearching] = useState(false);
  const { requestLocation, loading, error, hasLocation, latitude, longitude } = useGeolocation();

  const handleNearMeSearch = async () => {
    if (disabled || isSearching) return;

    setIsSearching(true);

    try {
      // Solicitar localização se não temos ainda
      if (!hasLocation) {
        toast.loading('Obtendo sua localização...', { id: 'location-request' });
        await new Promise<void>((resolve, reject) => {
          // Usar o hook de geolocalização
          const originalRequestLocation = requestLocation;
          requestLocation();
          
          // Verificar resultado após um delay
          setTimeout(() => {
            if (latitude && longitude) {
              resolve();
            } else {
              reject(new Error('Não foi possível obter localização'));
            }
          }, 10000); // 10 segundos timeout
        });
        toast.dismiss('location-request');
      }

      if (!latitude || !longitude) {
        throw new Error('Localização não disponível');
      }

      // Verificar se está em Portugal
      if (!isInPortugal(latitude, longitude)) {
        throw new Error('Este serviço está disponível apenas em Portugal');
      }

      toast.loading('Buscando trancistas próximas...', { id: 'search-nearby' });

      // Buscar braiders próximas
      const results = await searchNearbyBraiders({
        latitude,
        longitude,
        radius, // Use dynamic radius
        limit: 20
      });

      toast.dismiss('search-nearby');

      if (results.braiders.length === 0) {
        toast.error(`Nenhuma trancista encontrada num raio de ${radius}km da sua localização`);
        return;
      }

      toast.success(`${results.braiders.length} trancista${results.braiders.length > 1 ? 's' : ''} encontrada${results.braiders.length > 1 ? 's' : ''} próxima${results.braiders.length > 1 ? 's' : ''} de si!`);

      // Chamar callback com resultados
      onResultsFound(results.braiders, { lat: latitude, lon: longitude });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar trancistas próximas';
      console.error('Near me search error:', err);
      
      toast.dismiss('location-request');
      toast.dismiss('search-nearby');
      
      // Better error handling for development
      if (errorMessage.includes('Não foi possível obter localização') || errorMessage.includes('Em desenvolvimento local')) {
        toast.error('Localização não disponível. Use os filtros de distrito/concelho para buscar por região.', {
          duration: 4000
        });
      } else {
        toast.error(errorMessage);
      }
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const isLoading = loading || isSearching;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleNearMeSearch}
      disabled={disabled || isLoading}
      className={`rounded-full border-brand-200 text-brand-700 hover:bg-brand-50 hover:text-brand-800 hover:border-brand-300 transition-all duration-300 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Navigation className="h-4 w-4 mr-2" />
      )}
      {isLoading ? 'Localizando...' : 'Perto de Mim'}
    </Button>
  );
}

export default NearMeButton;