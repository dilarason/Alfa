type SplitType = 'lines' | 'words' | 'chars' | 'lines,words' | 'lines,chars' | 'words,chars' | 'lines,words,chars';

export type SplitTextOptions = {
  type?: SplitType;
  minLines?: number;
  lineThreshold?: number;
  noAriaLabel?: boolean;
  noBalance?: boolean;
  balanceRatio?: number;
  handleCJT?: boolean;
};

export default class SplitText {
  constructor(element: HTMLElement, options?: SplitTextOptions);
  split(): void;
  revert(): void;
  isSplit: boolean;
  chars: string[];
  words: string[];
  lines: string[];
  originals: HTMLElement[];
}
