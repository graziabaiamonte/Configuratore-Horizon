
import { ConfiguratorState } from '../types';

/**
 * Formats the configurator state into a flat object for the email service.
 */
const prepareEmailData = (data: ConfiguratorState) => {
  const { location, areas, technical, contact } = data;

  const locationInfo = location.mode === 'map' 
    ? `Coordinate GPS: ${location.coordinates?.lat}, ${location.coordinates?.lng}`
    : `Comune: ${location.municipality}, Prov: ${location.province}, Foglio: ${location.sheet}, Particella: ${location.parcel}`;

  return {
    "Oggetto": "Nuova Richiesta Fattibilità Fotovoltaico - Horizon",
    "Nome Cliente": `${contact.firstName} ${contact.lastName}`,
    "Email Cliente": contact.email,
    "Telefono": contact.phone,
    "Localizzazione": locationInfo,
    "Superficie Totale (m2)": `${areas.totalArea} m²`,
    "Superficie Contigua (m2)": `${areas.contiguousArea} m²`,
    "Distanza Linee Elettriche": `${technical.powerLineDistance} metri`,
    "Vicinanza Zona Industriale": technical.nearIndustrialZone ? 'Sì' : 'No',
    "Consenso GDPR": contact.gdprConsent ? 'Accettato' : 'Non Accettato',
    "_subject": `Nuova richiesta per affitto terreno: ${contact.firstName}`,
    "_template": "table" 
  };
};

export const sendLeadEmail = async (data: ConfiguratorState): Promise<boolean> => {
  // Recipient corrected to the requested address
  const recipient = "grazia.baiamonte@adduma.it";
  const url = `https://formsubmit.co/ajax/${recipient}`;

  try {
    const payload = prepareEmailData(data);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const result = await response.json();
    console.log("Email sent successfully:", result);
    return result.success === "true" || result.success === true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
};
