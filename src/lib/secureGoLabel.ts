// Markenname der SecureGo-App je Bank-Gruppe
export function getSecureGoLabel(group?: string): string {
  switch (group) {
    case "Sparda-Banken":
      return "SpardaSecureGo+";
    case "BBBank":
      return "BBBank SecureGo+";
    default:
      return "SecureGo plus";
  }
}
