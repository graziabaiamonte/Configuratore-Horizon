import React, { useState, useEffect } from "react";
import {
  ConfiguratorState,
  Step,
  LocationData,
  AreaData,
  TechnicalData,
  ContactData,
} from "./types";
import ProgressBar from "./components/ProgressBar";
import MapPicker from "./components/MapPicker";
import { sendLeadEmail } from "./services/emailService";

const App: React.FC = () => {
  const [state, setState] = useState<ConfiguratorState>({
    step: Step.Location,
    location: { mode: "map", coordinates: { lat: 41.9028, lng: 12.4964 } },
    areas: { totalArea: 0, contiguousArea: 0 },
    technical: { powerLineDistance: 0, nearIndustrialZone: false },
    contact: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      gdprConsent: false,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const nextStep = () => {
    if (state.step < Step.Summary) {
      setState((prev) => ({ ...prev, step: prev.step + 1 }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (state.step > Step.Location) {
      setState((prev) => ({ ...prev, step: prev.step - 1 }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const updateLocation = (updates: Partial<LocationData>) => {
    setState((prev) => ({
      ...prev,
      location: { ...prev.location, ...updates },
    }));
  };

  const updateAreas = (updates: Partial<AreaData>) => {
    setState((prev) => ({ ...prev, areas: { ...prev.areas, ...updates } }));
  };

  const updateTechnical = (updates: Partial<TechnicalData>) => {
    setState((prev) => ({
      ...prev,
      technical: { ...prev.technical, ...updates },
    }));
  };

  const updateContact = (updates: Partial<ContactData>) => {
    setState((prev) => ({ ...prev, contact: { ...prev.contact, ...updates } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.contact.gdprConsent) {
      alert("È necessario accettare il consenso alla privacy per procedere.");
      return;
    }
    setIsSubmitting(true);
    try {
      const success = await sendLeadEmail(state);
      if (success) {
        setShowToast(true);
        setTimeout(() => {
          setIsSubmitted(true);
          setState((prev) => ({ ...prev, step: Step.Summary }));
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 1000);
      } else {
        alert(
          "Si è verificato un errore durante l'invio. Si prega di riprovare."
        );
      }
    } catch (error) {
      alert("Si è verificato un errore durante l'invio. Riprova più tardi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const renderLocationStep = () => (
    <div className="animate-slide-in space-y-6">
      <div className="flex bg-white/20 p-1 mb-6">
        <button
          onClick={() => updateLocation({ mode: "map" })}
          className={`flex-1 py-3 px-4 text-sm font-bold transition-all ${
            state.location.mode === "map"
              ? "bg-[#d9d900] text-[#2e62ab]"
              : "text-white/80 hover:text-white"
          }`}
        >
          Mappa Interattiva
        </button>
        <button
          onClick={() => updateLocation({ mode: "manual" })}
          className={`flex-1 py-3 px-4 text-sm font-bold transition-all ${
            state.location.mode === "manual"
              ? "bg-[#d9d900] text-[#2e62ab]"
              : "text-white/80 hover:text-white"
          }`}
        >
          Dati Catastali
        </button>
      </div>

      {state.location.mode === "map" ? (
        <div className="space-y-4">
          <div className="bg-white/10 border-l-4 border-[#d9d900] p-4 flex items-start gap-3">
            <p className="text-xs text-white leading-relaxed font-medium">
              Cerca l'indirizzo del tuo terreno e usa lo strumento{" "}
              <span className="font-bold text-[#d9d900]">"Delimita Area"</span>{" "}
              per disegnare il perimetro. La superficie verrà calcolata
              automaticamente.
            </p>
          </div>
          <MapPicker
            onLocationSelect={(lat, lng) =>
              updateLocation({ coordinates: { lat, lng } })
            }
            onAreaCalculated={(area) =>
              updateAreas({ totalArea: area, contiguousArea: area })
            }
            initialPos={state.location.coordinates}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-semibold text-white/90 mb-1">
              Comune
            </label>
            <input
              type="text"
              value={state.location.municipality || ""}
              onChange={(e) => updateLocation({ municipality: e.target.value })}
              className="w-full px-4 py-3 bg-white/30 border border-white/40 text-white focus:border-[#d9d900] outline-none transition-all placeholder:text-white/60"
              placeholder="es. Milano"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-1">
              Provincia
            </label>
            <input
              type="text"
              value={state.location.province || ""}
              onChange={(e) => updateLocation({ province: e.target.value })}
              className="w-full px-4 py-3 bg-white/30 border border-white/40 text-white focus:border-[#d9d900] outline-none transition-all placeholder:text-white/60"
              placeholder="es. MI"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-1">
              Foglio
            </label>
            <input
              type="text"
              value={state.location.sheet || ""}
              onChange={(e) => updateLocation({ sheet: e.target.value })}
              className="w-full px-4 py-3 bg-white/30 border border-white/40 text-white focus:border-[#d9d900] outline-none transition-all placeholder:text-white/60"
              placeholder="es. 12"
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-semibold text-white/90 mb-1">
              Particella
            </label>
            <input
              type="text"
              value={state.location.parcel || ""}
              onChange={(e) => updateLocation({ parcel: e.target.value })}
              className="w-full px-4 py-3 bg-white/30 border border-white/40 text-white focus:border-[#d9d900] outline-none transition-all placeholder:text-white/60"
              placeholder="es. 450"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          onClick={nextStep}
          className="bg-[#d9d900] text-[#2e62ab] hover:bg-[#c6c700] px-10 py-4 font-black transition-all"
        >
          Conferma Località
        </button>
      </div>
    </div>
  );

  const renderAreasStep = () => (
    <div className="animate-slide-in space-y-6">
      <div className="space-y-4">
        <div className="bg-white/10 p-6 border border-white/20">
          <label className="block text-xs font-black uppercase tracking-widest text-white/80 mb-2">
            Superficie Totale (m²)
          </label>
          <div className="relative">
            <input
              type="number"
              value={state.areas.totalArea || ""}
              onChange={(e) =>
                updateAreas({ totalArea: Number(e.target.value) })
              }
              className="w-full px-6 py-4 bg-white/30 border border-white/40 outline-none text-2xl font-black text-white focus:border-[#d9d900] placeholder:text-white/60"
              placeholder="0"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-white/60 font-bold">
              m²
            </span>
          </div>
          {state.location.mode === "map" && state.areas.totalArea > 0 && (
            <p className="mt-3 text-xs text-[#d9d900] font-bold flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Calcolata automaticamente dalla mappa
            </p>
          )}
        </div>
        <div className="bg-white/10 p-6 border border-white/20">
          <label className="block text-xs font-black uppercase tracking-widest text-white/80 mb-2">
            Superficie Contigua (m²)
          </label>
          <div className="relative">
            <input
              type="number"
              value={state.areas.contiguousArea || ""}
              onChange={(e) =>
                updateAreas({ contiguousArea: Number(e.target.value) })
              }
              className="w-full px-6 py-4 bg-white/30 border border-white/40 outline-none text-xl font-bold text-white focus:border-[#d9d900] placeholder:text-white/60"
              placeholder="0"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-white/60 font-bold">
              m²
            </span>
          </div>
          <p className="mt-3 text-xs text-white/60 leading-relaxed italic">
            La superficie contigua è l'area effettivamente utilizzabile senza
            interruzioni.
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={prevStep}
          className="text-white/80 font-bold px-6 hover:text-white transition-colors"
        >
          Indietro
        </button>
        <button
          onClick={nextStep}
          disabled={state.areas.totalArea <= 0}
          className="bg-[#d9d900] text-[#2e62ab] hover:bg-[#c6c700] disabled:bg-white/30 disabled:text-white/50 px-10 py-4 font-black transition-all"
        >
          Prosegui
        </button>
      </div>
    </div>
  );

  const renderTechnicalStep = () => {
    const maxVal = 3000;
    const percentage = (state.technical.powerLineDistance / maxVal) * 100;

    return (
      <div className="animate-slide-in space-y-8">
        <div className="space-y-8">
          <div>
            <div className="flex justify-between items-end mb-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-white/80 mb-1">
                  Distanza infrastruttura
                </label>
                <h4 className="text-lg font-bold text-white">
                  Cabine / Linee Elettriche
                </h4>
              </div>
              <span className="bg-white/20 text-white px-4 py-1.5 text-sm font-black tracking-tight">
                {state.technical.powerLineDistance} metri
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={maxVal}
              step="50"
              value={state.technical.powerLineDistance}
              onChange={(e) =>
                updateTechnical({ powerLineDistance: Number(e.target.value) })
              }
              style={{
                background: `linear-gradient(to right, #d9d900 0%, #d9d900 ${percentage}%, rgba(255,255,255,0.3) ${percentage}%, rgba(255,255,255,0.3) 100%)`,
              }}
              className="w-full h-3 appearance-none cursor-pointer transition-all border border-white/20"
            />
            <div className="flex justify-between text-[10px] font-bold text-white/60 mt-3 px-1 uppercase tracking-tighter">
              <span>Adiacente</span>
              <span>1.5km</span>
              <span>Oltre 3km</span>
            </div>
          </div>

          <div className="bg-white/10 p-6 border border-white/20 flex items-center justify-between group">
            <div className="pr-4">
              <h4 className="text-base font-bold text-white mb-1">
                Contesto Industriale
              </h4>
              <p className="text-xs text-white/80 leading-relaxed">
                Il terreno si trova in prossimità di aree produttive o tetti
                industriali?
              </p>
            </div>
            <button
              onClick={() =>
                updateTechnical({
                  nearIndustrialZone: !state.technical.nearIndustrialZone,
                })
              }
              className={`relative inline-flex h-8 w-14 shrink-0 items-center transition-all focus:outline-none ${
                state.technical.nearIndustrialZone
                  ? "bg-[#d9d900]"
                  : "bg-white/40"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform transition-transform duration-300 ${
                  state.technical.nearIndustrialZone
                    ? "translate-x-7 bg-[#2e62ab]"
                    : "translate-x-1 bg-white"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <button
            onClick={prevStep}
            className="text-white/80 font-bold px-6 hover:text-white transition-colors"
          >
            Indietro
          </button>
          <button
            onClick={nextStep}
            className="bg-[#d9d900] text-[#2e62ab] hover:bg-[#c6c700] px-10 py-4 font-black transition-all"
          >
            Step Finale
          </button>
        </div>
      </div>
    );
  };

  const renderContactStep = () => (
    <form onSubmit={handleSubmit} className="animate-slide-in space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="group">
          <label className="block text-xs font-black uppercase tracking-widest text-white/80 mb-2 px-1">
            Nome
          </label>
          <input
            required
            type="text"
            value={state.contact.firstName}
            onChange={(e) => updateContact({ firstName: e.target.value })}
            className="w-full px-5 py-4 bg-white/30 border border-white/40 text-white focus:border-[#d9d900] outline-none transition-all font-medium placeholder:text-white/60"
            placeholder="Il tuo nome"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-white/80 mb-2 px-1">
            Cognome
          </label>
          <input
            required
            type="text"
            value={state.contact.lastName}
            onChange={(e) => updateContact({ lastName: e.target.value })}
            className="w-full px-5 py-4 bg-white/30 border border-white/40 text-white focus:border-[#d9d900] outline-none transition-all font-medium placeholder:text-white/60"
            placeholder="Il tuo cognome"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-white/80 mb-2 px-1">
            Email Personale
          </label>
          <input
            required
            type="email"
            value={state.contact.email}
            onChange={(e) => updateContact({ email: e.target.value })}
            className="w-full px-5 py-4 bg-white/30 border border-white/40 text-white focus:border-[#d9d900] outline-none transition-all font-medium placeholder:text-white/60"
            placeholder="indirizzo@email.it"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-white/80 mb-2 px-1">
            Recapito Telefonico
          </label>
          <input
            required
            type="tel"
            value={state.contact.phone}
            onChange={(e) => updateContact({ phone: e.target.value })}
            className="w-full px-5 py-4 bg-white/30 border border-white/40 text-white focus:border-[#d9d900] outline-none transition-all font-medium placeholder:text-white/60"
            placeholder="+39 ..."
          />
        </div>
      </div>

      <div className="flex items-start gap-4 p-6 bg-white/10 border border-white/20">
        <div className="pt-1">
          <input
            id="gdpr"
            required
            type="checkbox"
            checked={state.contact.gdprConsent}
            onChange={(e) => updateContact({ gdprConsent: e.target.checked })}
            className="w-5 h-5 border-white/60 bg-transparent text-[#d9d900] focus:ring-offset-0 focus:ring-white/40 cursor-pointer transition-all"
          />
        </div>
        <label
          htmlFor="gdpr"
          className="text-xs text-white/80 leading-relaxed font-medium cursor-pointer"
        >
          Ho letto e accetto il trattamento dei dati personali ai fini della
          presente valutazione tecnica, in conformità al{" "}
          <span className="text-white font-bold underline">
            GDPR (UE 2016/679)
          </span>
          .
        </label>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={prevStep}
          className="text-white/80 font-bold px-6 hover:text-white transition-colors"
        >
          Indietro
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#d9d900] text-[#2e62ab] hover:bg-[#c6c700] disabled:bg-white/30 disabled:text-white/50 px-12 py-4 font-black transition-all flex items-center gap-3"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Invio Richiesta...
            </>
          ) : (
            <>
              Richiedi Valutazione
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );

  const renderSummaryStep = () => (
    <div className="animate-slide-in text-center py-16 space-y-8">
      <div className="relative inline-block">
        <div className="w-24 h-24 bg-[#80c080]/20 text-[#80c080] flex items-center justify-center mx-auto border-4 border-[#80c080]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>
      <div>
        <h2 className="text-4xl font-black text-white mb-4 tracking-tight">
          Richiesta Inviata con Successo!
        </h2>
        <p className="text-white/80 max-w-md mx-auto leading-relaxed font-medium text-lg">
          I dati del tuo terreno sono stati trasmessi correttamente. Verrai
          ricontattato entro 24-48 ore.
        </p>
      </div>
      <div className="pt-6">
        <button
          onClick={() => window.location.reload()}
          className="bg-[#d9d900] text-[#2e62ab] px-8 py-4 font-black hover:bg-[#c6c700] transition-all flex items-center gap-2 mx-auto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Nuova Valutazione
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-12 px-4 md:px-8">
      {showToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[2000] bg-[#80c080] text-white px-8 py-4 animate-slide-in flex items-center gap-3 font-bold border-2 border-white/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Messaggio Inviato!
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {!isSubmitted && (
          <div className="mb-10 max-w-2xl mx-auto">
            <ProgressBar currentStep={state.step} totalSteps={4} />
          </div>
        )}

        <main className="bg-transparent p-0 md:p-4 relative overflow-hidden">
          <div className="relative z-10">
            {state.step === Step.Location && renderLocationStep()}
            {state.step === Step.Areas && renderAreasStep()}
            {state.step === Step.Technical && renderTechnicalStep()}
            {state.step === Step.Contact && renderContactStep()}
            {state.step === Step.Summary && renderSummaryStep()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
