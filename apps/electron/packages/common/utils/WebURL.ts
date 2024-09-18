class WebURL {
  static get baseURL() {
    return import.meta.env.VITE_WEB_BASE_URL;
  }

  static storeExtension(extensionName: string, extensionId: string) {
    return `${this.baseURL}/store/extensions/${extensionName}/${extensionId}`;
  }

  static profilePage(username: string) {
    return `${this.baseURL}/u/${username}`;
  }
}

export default WebURL;
