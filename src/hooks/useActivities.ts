import { useState, useEffect } from 'react';
import { Activity, Role, Signup } from '../types';
import { activitiesApi, rolesApi, signupsApi } from '../lib/api';

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const records = await activitiesApi.getAll();
      // Transform API response to match frontend types
      setActivities(records.map((a: any) => ({
        id: a.id,
        name: a.name,
        date: a.date,
        description: a.description,
        creator: a.creatorId,
        status: a.status,
        zone: a.zone,
        minIP: a.minIP,
        minFame: a.minFame,
        created: a.createdAt,
        updated: a.updatedAt,
        expand: {
          creator: a.creator,
        },
      })));
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      // Fetch roles for all activities
      const allRoles: Role[] = [];
      for (const activity of activities) {
        const records = await rolesApi.getByActivity(activity.id);
        allRoles.push(...records.map((r: any) => ({
          id: r.id,
          activity: r.activityId,
          name: r.name,
          slots: r.slots,
          attributes: typeof r.attributes === 'string' ? JSON.parse(r.attributes) : r.attributes,
          created: r.createdAt,
          updated: r.updatedAt,
        })));
      }
      setRoles(allRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchSignups = async () => {
    try {
      // Fetch signups for all activities
      const allSignups: Signup[] = [];
      for (const activity of activities) {
        const records = await signupsApi.getByActivity(activity.id);
        allSignups.push(...records.map((s: any) => ({
          id: s.id,
          activity: s.activityId,
          role: s.roleId,
          player: s.playerId,
          attributes: typeof s.attributes === 'string' ? JSON.parse(s.attributes) : s.attributes,
          comment: s.comment,
          created: s.createdAt,
          updated: s.updatedAt,
          expand: {
            activity: s.activity,
            role: s.role,
            player: s.player,
          },
        })));
      }
      setSignups(allSignups);
    } catch (error) {
      console.error('Error fetching signups:', error);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await fetchActivities();
    // After activities are fetched, get their IDs and fetch roles/signups
    const currentActivities = await activitiesApi.getAll();
    const activityIds = currentActivities.map((a: any) => a.id);
    if (activityIds.length > 0) {
      await Promise.all([fetchRoles(activityIds), fetchSignups(activityIds)]);
    }
    setLoading(false);
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
