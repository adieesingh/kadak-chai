export interface AiProvider {
  name: string;
  /** Returns the raw text the model produced. May throw; the caller maps errors. */
  complete(input: { story: string; signal?: AbortSignal }): Promise<string>;
}
