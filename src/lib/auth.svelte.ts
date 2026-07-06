let token = $state(localStorage.getItem('media_token'));

export function getAuth() {
  return {
    get token() { return token; },
    get isAuthenticated() { return !!token; },
    login(newToken: string) {
      localStorage.setItem('media_token', newToken);
      token = newToken;
    },
    logout() {
      localStorage.removeItem('media_token');
      token = null;
    },
  };
}
