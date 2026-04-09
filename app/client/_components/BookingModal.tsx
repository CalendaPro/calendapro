'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Service = {
  id: string
  name: string
  duration: number
  price: number
}

type BookingModalProps = {
  isOpen: boolean
  onClose: () => void
  proName: string
  services: Service[]
}

export default function BookingModal({ isOpen, onClose, proName, services }: BookingModalProps) {
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')

  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30']

  const resetForm = () => {
    setStep(1)
    setSelectedService(null)
    setSelectedDate('')
    setSelectedTime('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      // Submit booking
      console.log('Booking submitted:', { selectedService, selectedDate, selectedTime })
      handleClose()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
        >
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                    step >= i
                      ? 'bg-gradient-to-r from-violet-600 to-rose-500 text-white'
                      : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  {i}
                </div>
                {i < 3 && (
                  <div
                    className={`w-8 h-0.5 mx-2 ${
                      step > i ? 'bg-gradient-to-r from-violet-600 to-rose-500' : 'bg-stone-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Choose Service */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">Choisir un service</h2>
              <div className="space-y-3 mb-6">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${
                      selectedService?.id === service.id
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-stone-200 hover:border-violet-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="service"
                        checked={selectedService?.id === service.id}
                        onChange={() => setSelectedService(service)}
                        className="w-4 h-4 text-violet-600"
                      />
                      <div>
                        <div className="font-medium text-stone-900">{service.name}</div>
                        <div className="text-sm text-stone-500">{service.duration} min</div>
                      </div>
                    </div>
                    <div className="font-semibold text-stone-900">{service.price}€</div>
                  </label>
                ))}
              </div>
              {selectedService && (
                <div className="flex justify-between items-center p-4 bg-stone-50 rounded-xl mb-4">
                  <span className="font-medium text-stone-900">Total:</span>
                  <span className="text-xl font-bold text-violet-600">{selectedService.price}€</span>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!selectedService}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Choose Date/Time */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">Choisir une date et heure</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-700 mb-2">Heure</label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-3 px-4 rounded-xl font-medium transition-colors ${
                        selectedTime === time
                          ? 'bg-gradient-to-r from-violet-600 to-rose-500 text-white'
                          : 'border border-stone-200 text-stone-700 hover:border-violet-400'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDate && selectedTime && (
                <div className="flex justify-between items-center p-4 bg-stone-50 rounded-xl mb-4">
                  <span className="font-medium text-stone-900">
                    {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                  <span className="font-semibold text-violet-600">{selectedTime}</span>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border border-stone-200 text-stone-700 rounded-xl hover:border-violet-400 transition-colors"
                >
                  ← Précédent
                </button>
                <button
                  onClick={handleNext}
                  disabled={!selectedDate || !selectedTime}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment & Confirmation */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-stone-900 mb-4">Paiement & Confirmation</h2>
              
              <div className="bg-stone-50 rounded-xl p-4 mb-6">
                <h3 className="font-medium text-stone-900 mb-3">📋 Récapitulatif</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Service:</span>
                    <span className="font-medium text-stone-900">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Prix:</span>
                    <span className="font-medium text-stone-900">{selectedService?.price}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Date:</span>
                    <span className="font-medium text-stone-900">
                      {selectedDate && new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Heure:</span>
                    <span className="font-medium text-stone-900">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Durée:</span>
                    <span className="font-medium text-stone-900">{selectedService?.duration} min</span>
                  </div>
                </div>
                <div className="border-t border-stone-200 mt-3 pt-3 flex justify-between">
                  <span className="font-semibold text-stone-900">Total:</span>
                  <span className="text-xl font-bold text-violet-600">{selectedService?.price}€</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full" />
                  <span className="text-sm text-stone-600">Acompte requis : {Math.round((selectedService?.price || 0) * 0.2)}€ (20%)</span>
                </div>
                <button className="w-full px-6 py-3 border border-stone-200 text-stone-700 rounded-xl hover:border-violet-400 transition-colors flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  Payer avec Stripe
                </button>
              </div>

              <div className="flex items-start gap-2 mb-6 p-3 bg-blue-50 rounded-xl">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <p className="text-sm text-blue-800">
                  Vous recevrez une confirmation par email et SMS (optionnel).
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border border-stone-200 text-stone-700 rounded-xl hover:border-violet-400 transition-colors"
                >
                  ← Précédent
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  ✓ Confirmer la réservation
                </button>
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
