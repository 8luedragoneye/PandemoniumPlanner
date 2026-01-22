import { useState, useEffect } from 'react';
import { Activity, Role, Signup } from '../types';
import { activitiesApi, rolesApi, signupsApi } from '../lib/api';
import { transformActivity, transformRole, transformSignup } from '../lib/transformers';

interface UseActivitiesReturn {
  activities: Activity[];
  roles: Role[];
  signups: Signup[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useActivities(): UseActivitiesReturn {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async (): Promise<void> => {
    setLoading(true);
    try {
      // Fetch activities first
      const activityRecords = await activitiesApi.getAll();
      const transformedActivities = activityRecords.map(transformActivity);
      setActivities(transformedActivities);

      // Fetch roles and signups for all activities in parallel
      const activityIds = transformedActivities.map(a => a.id);
      
      const [roleResults, signupResults] = await Promise.all([
        Promise.all(
          activityIds.map(async (activityId) => {
            try {
              const roleRecords = await rolesApi.getByActivity(activityId);
              return roleRecords.map(transformRole);
            } catch (error) {
              console.error(`Error fetching roles for activity ${activityId}:`, error);
              return [];
            }
          })
        ),
        Promise.all(
          activityIds.map(async (activityId) => {
            try {
              const signupRecords = await signupsApi.getByActivity(activityId);
              return signupRecords.map(transformSignup);
            } catch (error) {
              console.error(`Error fetching signups for activity ${activityId}:`, error);
              return [];
            }
          })
        ),
      ]);

      // Flatten arrays
      setRoles(roleResults.flat());
      setSignups(signupResults.flat());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return {
    activities,
    roles,
    signups,
    loading,
    refetch: fetchAll,
  };
}
