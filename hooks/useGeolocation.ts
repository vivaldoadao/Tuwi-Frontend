import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  loading: boolean;
  accuracy?: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  latitude?: number;
  longitude?: number;
  speed?: number | null;
  timestamp?: number;
  error?: string;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useGeolocation = (options?: GeolocationOptions) => {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    accuracy: undefined,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    latitude: undefined,
    longitude: undefined,
    speed: null,
    timestamp: undefined,
    error: undefined,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: 'Geolocalização não é suportada neste navegador'
      }));
      return;
    }

    setState(prevState => ({ ...prevState, loading: true, error: undefined }));

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        loading: false,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed,
        timestamp: position.timestamp,
        error: undefined,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      let errorMessage = 'Erro ao obter localização';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          if (typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname === 'localhost') {
            errorMessage = 'Em desenvolvimento local, permita localização nas configurações do navegador ou use HTTPS';
          } else {
            errorMessage = 'Acesso à localização foi negado pelo usuário';
          }
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Informação de localização não está disponível';
          break;
        case error.TIMEOUT:
          errorMessage = 'Tempo limite para obter localização foi excedido';
          break;
      }

      setState(prevState => ({
        ...prevState,
        loading: false,
        error: errorMessage,
      }));
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000, // 5 minutes
        ...options,
      }
    );
  }, [options]);

  return {
    ...state,
    requestLocation,
    isSupported: !!navigator.geolocation,
    hasLocation: state.latitude !== undefined && state.longitude !== undefined,
  };
};

// Hook para watch da posição (atualização contínua)
export const useWatchPosition = (options?: GeolocationOptions) => {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    accuracy: undefined,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    latitude: undefined,
    longitude: undefined,
    speed: null,
    timestamp: undefined,
    error: undefined,
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: 'Geolocalização não é suportada neste navegador'
      }));
      return;
    }

    setState(prevState => ({ ...prevState, loading: true, error: undefined }));

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        loading: false,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed,
        timestamp: position.timestamp,
        error: undefined,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      let errorMessage = 'Erro ao obter localização';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          if (typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname === 'localhost') {
            errorMessage = 'Em desenvolvimento local, permita localização nas configurações do navegador ou use HTTPS';
          } else {
            errorMessage = 'Acesso à localização foi negado pelo usuário';
          }
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Informação de localização não está disponível';
          break;
        case error.TIMEOUT:
          errorMessage = 'Tempo limite para obter localização foi excedido';
          break;
      }

      setState(prevState => ({
        ...prevState,
        loading: false,
        error: errorMessage,
      }));
    };

    const id = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
        ...options,
      }
    );

    setWatchId(id);
  }, [options]);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setState(prevState => ({ ...prevState, loading: false }));
    }
  }, [watchId]);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    ...state,
    startWatching,
    stopWatching,
    isWatching: watchId !== null,
    isSupported: !!navigator.geolocation,
    hasLocation: state.latitude !== undefined && state.longitude !== undefined,
  };
};

// Utilitário para calcular distância entre duas coordenadas (cliente)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Arredondar para 2 casas decimais
};

// Validar se coordenadas estão em Portugal
export const isInPortugal = (lat: number, lon: number): boolean => {
  const portugalBounds = {
    north: 42.2,
    south: 36.8,
    east: -6.0,
    west: -9.6
  };
  
  return lat >= portugalBounds.south && 
         lat <= portugalBounds.north && 
         lon >= portugalBounds.west && 
         lon <= portugalBounds.east;
};