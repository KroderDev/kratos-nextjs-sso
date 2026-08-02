export const SETTINGS_AREA_COOKIE = "kratos_settings_area";
export const FLOW_SUCCESS_TOASTS_STORAGE_KEY = "kratos_flow_success_toasts:v2";
export const SETTINGS_AREA_COOKIE_MAX_AGE = 120;

export function formatSettingsAreaCookie(area: string) {
  return `${SETTINGS_AREA_COOKIE}=${encodeURIComponent(area)}; Max-Age=${SETTINGS_AREA_COOKIE_MAX_AGE}; Path=/dashboard/settings; SameSite=Lax`;
}
