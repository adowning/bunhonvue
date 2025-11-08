export class GenericApplicationError extends Error {
  constructor(message: string = "An unexpected application error occurred.") {
    super(message);
    this.name = "GenericApplicationError"; // Set the name for easier identification in logs
    Object.setPrototypeOf(this, GenericApplicationError.prototype); // Maintain proper prototype chain for instanceof checks
  }
}
