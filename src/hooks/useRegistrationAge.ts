import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRegistrationAge = (userId: string | undefined): number | null => {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) {
      setDays(null);
      return;
    }

    const fetchCreatedAt = async () => {
      try {
        // Get profile created_at (mirrors auth.users creation)
        const { data, error } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('id', userId)
          .single();

        if (error || !data) {
          console.error('Error fetching profile created_at:', error);
          return;
        }

        const createdAt = new Date(data.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdAt.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        setDays(diffDays);
      } catch (err) {
        console.error('Registration age error:', err);
      }
    };

    fetchCreatedAt();
  }, [userId]);

  return days;
};
