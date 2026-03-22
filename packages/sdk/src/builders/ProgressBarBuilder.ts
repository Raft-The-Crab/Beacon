/**
 * Options for generating a visual progress bar.
 */
export interface ProgressBarOptions {
  /** Total value for the bar (100%). Default is 100. */
  max?: number;
  /** Length of the bar in characters. Default is 10. */
  length?: number;
  /** Character for the completed part. Default is '█'. */
  filledChar?: string;
  /** Character for the remaining part. Default is '░'. */
  emptyChar?: string;
  /** Whether to show percentage at the end. Default is false. */
  showPercentage?: boolean;
}

/**
 * ProgressBarBuilder — Utility to generate visual text-based progress bars.
 */
export class ProgressBarBuilder {
  private value: number = 0;
  private options: Required<ProgressBarOptions>;

  constructor(options: ProgressBarOptions = {}) {
    this.options = {
      max: options.max || 100,
      length: options.length || 10,
      filledChar: options.filledChar || '█',
      emptyChar: options.emptyChar || '░',
      showPercentage: options.showPercentage || false,
    };
  }

  setValue(value: number): this {
    this.value = Math.max(0, Math.min(this.options.max, value));
    return this;
  }

  build(): string {
    const percentage = this.value / this.options.max;
    const filledLength = Math.round(percentage * this.options.length);
    const emptyLength = this.options.length - filledLength;

    const bar = 
      this.options.filledChar.repeat(filledLength) + 
      this.options.emptyChar.repeat(emptyLength);

    if (this.options.showPercentage) {
      return `${bar} ${Math.round(percentage * 100)}%`;
    }

    return bar;
  }

  /**
   * Static helper for quick bar generation.
   */
  static create(value: number, max: number = 100, length: number = 10): string {
    return new ProgressBarBuilder({ max, length }).setValue(value).build();
  }
}
