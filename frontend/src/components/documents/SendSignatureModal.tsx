import React, { useState } from 'react';
import { Plus, Trash2, User, Mail, Phone } from 'lucide-react';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useSendForSignature } from '@/hooks/useDocumentTracking';
import type { Document, ReminderFrequency } from '@/lib/types';

interface Signatory {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface SendSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
}

const reminderFrequencyOptions: { value: ReminderFrequency; label: string }[] = [
  { value: 'DAILY', label: 'Quotidien' },
  { value: 'EVERY_2_DAYS', label: 'Tous les 2 jours' },
  { value: 'EVERY_3_DAYS', label: 'Tous les 3 jours' },
  { value: 'WEEKLY', label: 'Hebdomadaire' },
];

export function SendSignatureModal({
  isOpen,
  onClose,
  document,
}: SendSignatureModalProps) {
  const [signatories, setSignatories] = useState<Signatory[]>([
    { firstName: '', lastName: '', email: '', phone: '' },
  ]);
  const [message, setMessage] = useState('');
  const [deadline, setDeadline] = useState('');
  const [autoReminders, setAutoReminders] = useState(true);
  const [reminderFrequency, setReminderFrequency] = useState<ReminderFrequency>('DAILY');
  const [maxReminders, setMaxReminders] = useState(5);

  const sendForSignature = useSendForSignature();

  const addSignatory = () => {
    setSignatories([...signatories, { firstName: '', lastName: '', email: '', phone: '' }]);
  };

  const removeSignatory = (index: number) => {
    if (signatories.length > 1) {
      setSignatories(signatories.filter((_, i) => i !== index));
    }
  };

  const updateSignatory = (index: number, field: keyof Signatory, value: string) => {
    setSignatories(
      signatories.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validSignatories = signatories.filter(
      (s) => s.firstName && s.lastName && s.email
    );

    if (validSignatories.length === 0) {
      return;
    }

    await sendForSignature.mutateAsync({
      documentId: document.id,
      input: {
        signatories: validSignatories,
        message: message || undefined,
        deadline: deadline || undefined,
        autoReminders,
        reminderFrequency,
        maxReminders,
      },
    });

    onClose();
    resetForm();
  };

  const resetForm = () => {
    setSignatories([{ firstName: '', lastName: '', email: '', phone: '' }]);
    setMessage('');
    setDeadline('');
    setAutoReminders(true);
    setReminderFrequency('DAILY');
    setMaxReminders(5);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const isValid = signatories.some((s) => s.firstName && s.lastName && s.email);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Envoyer pour signature"
      description={`Document: ${document.name}`}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {/* Signatories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Signataires</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addSignatory}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Ajouter
            </Button>
          </div>

          <div className="space-y-3">
            {signatories.map((signatory, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Signataire {index + 1}
                  </span>
                  {signatories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSignatory(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Prenom</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={signatory.firstName}
                        onChange={(e) =>
                          updateSignatory(index, 'firstName', e.target.value)
                        }
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Jean"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nom</label>
                    <input
                      type="text"
                      value={signatory.lastName}
                      onChange={(e) =>
                        updateSignatory(index, 'lastName', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Dupont"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={signatory.email}
                        onChange={(e) =>
                          updateSignatory(index, 'email', e.target.value)
                        }
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="jean.dupont@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Telephone (optionnel)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        value={signatory.phone || ''}
                        onChange={(e) =>
                          updateSignatory(index, 'phone', e.target.value)
                        }
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="+33 6 12 34 56 78"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message personnalise (optionnel)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={3}
            placeholder="Message qui sera envoye aux signataires..."
          />
        </div>

        {/* Deadline */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date limite (optionnel)
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Auto-reminders */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Relances automatiques
              </label>
              <p className="text-xs text-gray-500">
                Envoyer des rappels aux signataires
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoReminders}
                onChange={(e) => setAutoReminders(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          {autoReminders && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Frequence</label>
                <select
                  value={reminderFrequency}
                  onChange={(e) =>
                    setReminderFrequency(e.target.value as ReminderFrequency)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {reminderFrequencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Nombre max de relances
                </label>
                <input
                  type="number"
                  value={maxReminders}
                  onChange={(e) => setMaxReminders(parseInt(e.target.value) || 5)}
                  min={1}
                  max={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            type="submit"
            isLoading={sendForSignature.isPending}
            disabled={!isValid}
          >
            Envoyer pour signature
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default SendSignatureModal;
