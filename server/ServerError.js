export class ServerError extends Error {
    constructor(message, options = {}) {
      super(message);
      this.name = "ServerError";
      this.code = options.code || 500
    }
  }
  