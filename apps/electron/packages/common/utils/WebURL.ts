class WebURL {
  static storeExtension(extensionName: string, extensionId: string) {
    return `${import.meta.env.VITE_WEB_BASE_URL}/store/extensions/${extensionName}/${extensionId}`;
  }
}

export default WebURL;
