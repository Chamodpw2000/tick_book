import { getAuthTokenFromStorage } from "./auth";
import { authBearerTokenInterceptor, createHttpClient } from "./http";
import { getServiceUrl } from "./services";

const authInterceptor = authBearerTokenInterceptor(getAuthTokenFromStorage);

export const artistApi = createHttpClient({
	baseUrl: getServiceUrl("artist"),
	requestInterceptors: [authInterceptor],
});
export const eventApi = createHttpClient({
	baseUrl: getServiceUrl("event"),
	requestInterceptors: [authInterceptor],
});
export const bookingApi = createHttpClient({
	baseUrl: getServiceUrl("booking"),
	requestInterceptors: [authInterceptor],
});
export const paymentApi = createHttpClient({
	baseUrl: getServiceUrl("payment"),
	requestInterceptors: [authInterceptor],
});
export const inventoryApi = createHttpClient({
	baseUrl: getServiceUrl("inventory"),
	requestInterceptors: [authInterceptor],
});
export const userApi = createHttpClient({
	baseUrl: getServiceUrl("user"),
	requestInterceptors: [authInterceptor],
});
export const venueApi = createHttpClient({
	baseUrl: getServiceUrl("venue"),
	requestInterceptors: [authInterceptor],
});
