// Phase 3: Full implementation.
// Stub provides the public interface so main.js can import safely.

export const notifications = {
  get isSupported() {
    return "Notification" in window;
  },

  get permission() {
    return this.isSupported ? Notification.permission : "denied";
  },

  async request() {
    if (!this.isSupported) return "denied";
    const result = await Notification.requestPermission();
    return result;
  },

  send(title, body) {
    if (!this.isSupported || this.permission !== "granted") return false;
    new Notification(title, {
      body,
      icon: "/favicon.svg",
      tag: "focusflow-session",
    });
    return true;
  },
};
