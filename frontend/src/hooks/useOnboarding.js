import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function useOnboarding() {
  const [completed, setCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/onboarding/status')
      .then(({ data }) => {
        setCompleted(data.data.completed);
        setCurrentStep(data.data.currentStep);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load onboarding status');
      })
      .finally(() => setLoading(false));
  }, []);

  const saveStep = useCallback(async (step, body = {}) => {
    setSaving(true);
    setError(null);
    try {
      await api.post(`/onboarding/step/${step}`, body);
      setCurrentStep(step);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save step');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await api.post('/onboarding/complete');
      setCompleted(true);
      setCurrentStep(5);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete onboarding');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { completed, currentStep, loading, saving, error, saveStep, completeOnboarding };
}
