import relayout from '../balance-text/index.js';

function toArray(e, parent) {
  return !e || e.length === 0 ? [] : e.nodeName ? [e] : [].slice.call(e[0].nodeName ? e : (parent || document).querySelectorAll(e));
}

const NBSP = String.fromCharCode(160);
const NNBSP = String.fromCharCode(8239);
const SPACES = [' ', NBSP, NNBSP];
const BLOCK_TAGS = ['DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'UL', 'OL', 'LI'];

export const isFontReady = () => {
  const promise = new Promise((resolve) => {
    document.fonts.ready.then(resolve);
  });
  return promise;
};

export default class SplitText {
  isSplit = false;
  chars = [];
  words = [];
  lines = [];
  originals = [];
  lineParents = [];
  elements = [];
  options = {};

  constructor(
    element,
    options = {
      lineThreshold: 0.2,
      type: 'lines',
      noAriaLabel: false,
      noBalance: false,
      balanceRatio: 1,
      minLines: 1,
      handleCJT: false,
    }
  ) {
    this.elements = toArray(element);
    this.options = options;

    this.options.lineThreshold = typeof this.options.lineThreshold === 'number' ? this.options.lineThreshold : 0.2;
    this.options.noAriaLabel = typeof this.options.noAriaLabel === 'boolean' ? this.options.noAriaLabel : false;
    this.options.noBalance = typeof this.options.noBalance === 'boolean' ? this.options.noBalance : false;
    this.options.minLines = typeof this.options.minLines === 'number' ? this.options.minLines : 1;
    this.options.handleCJT = typeof this.options.handleCJT === 'boolean' ? this.options.handleCJT : false;
    this.options.type = typeof this.options.type === 'string' ? this.options.type : 'lines';
    this.split();
  }

  split() {
    if (this.isSplit) this.revert();

    const by = (this.options.type || 'lines').split(',').map((s) => s.trim());
    const byLines = ~by.indexOf('lines');
    const byWords = ~by.indexOf('words');
    const byChars = ~by.indexOf('chars');

    this.elements.forEach((element, i) => {
      element.__isParent = true;

      this.originals[i] = element.innerHTML.trim();

      // replace all zero width space with <wbr>
      element.innerHTML = element.innerHTML
        .trim()
        .split(/\u200b/)
        .join('<wbr>');

      this.balance(element);

      if (byWords || byLines || byChars) {
        this.words.push(...this.splitElement(element, 'word', /\s+/, true));

        if (this.words.length === 1 && this.words[0].offsetWidth < element.parentElement.offsetWidth) {
          // if we have a single word and it's smaller than the parent element, remove the max-width from the line parents
          this.lineParents.forEach((l) => l.style.removeProperty('max-width'));
        }

        if (byLines) {
          this.detectLinesTop(element, this.words, this.options.lineThreshold);
          const proceed = this.checkMinLines(element, this.words);
          if (!proceed) return;
          element.style.removeProperty('width');
          this.attachBr(element, this.words);
          this.splitBr(element);
          this.replaceWords(element, (byLines || byWords) && !byChars);
          this.lines.push(...this.splitLines(element));
          const earlyReturn = this.checkBalance(element, i);
          if (!earlyReturn) return;
          this.safeCheckBalance = 0;
        }

        if (byLines && !byWords && !byChars) {
          this.lines.forEach((l) => {
            l.__words.forEach((w) => {
              w.insertAdjacentHTML('beforebegin', w.textContent);
              w.remove();
            });
            l.normalize();
          });
          this.words.length = 0;
          this.chars.length = 0;
        }

        if (byChars) {
          this.words.forEach((e) => this.chars.push(...this.splitElement(e, 'char', '', false)));
          if (!byWords) {
            this.chars.forEach((e) => {
              e.parentElement.insertAdjacentHTML('beforebegin', e.outerHTML);
              e.remove();
            });
            this.chars = toArray(element.getElementsByClassName('char'));
            this.words.forEach((e) => e.remove());
            this.words.length = 0;
          }
        }
      }

      if (!this.options.noAriaLabel && (byChars || byWords)) {
        this.recursiveAriaLabel(element);

        // Handle A tags
        const focusableTags = toArray(element.querySelectorAll('a, button'));
        focusableTags.forEach(this.createAriaLabel);
      }
    });

    this.isSplit = true;
  }

  recursiveAriaLabel(element) {
    const blockTags = toArray(element.childNodes).filter((child) => BLOCK_TAGS.includes(child.tagName));
    if (blockTags.length) {
      blockTags.forEach((child) => {
        this.recursiveAriaLabel(child);
      });
    } else {
      this.createAriaLabel(element);
    }
  }

  createAriaLabel(element) {
    const span = document.createElement('span');
    span.classList.add('sr-only');
    span.style.setProperty('position', 'absolute');
    span.style.setProperty('width', '1px');
    span.style.setProperty('height', '1px');
    span.style.setProperty('padding', '0');
    span.style.setProperty('margin', '-1px');
    span.style.setProperty('overflow', 'hidden');
    span.style.setProperty('clip', 'rect(0, 0, 0, 0)');
    span.style.setProperty('white-space', 'nowrap');
    span.style.setProperty('border', '0');
    span.textContent = element.textContent;
    element.appendChild(span);
  }

  /**
   * There are some occasions where the lines after being balanced, exceeds the element bounding box
   * this check prevents that, and takes into accout also very long kebab cased string.
   */
  checkBalance(_, index) {
    if (this.options.noBalance) return true;
    const removeParentMaxWidth = this.lines.filter((l) => l.scrollWidth > l.parentElement.offsetWidth);
    for (let i = 0; i < removeParentMaxWidth.length; i++) {
      const l = removeParentMaxWidth[i];
      const text = l.__words[0]?.textContent;
      // Special check for kebab string -> a4e5ee87-8e56-4b73-ad56-4e2d9b7aba16
      if (l.__wordCount === 1 && text.match(/\b\w+-\w+\b/) && this.safeCheckBalance <= 5) {
        // split the text into parts and add zero width spaces
        const newWordText = text.split('-').join('-&#8203;');
        this.originals[index] = this.originals[index].replace(text, newWordText);
        this.safeCheckBalance++;
        this.revert();
        this.split();
        return false;
      }
      l.parentElement.style.removeProperty('max-width');
    }
    return true;
  }

  revert() {
    if (this.originals.length === 0) return;
    this.elements.forEach((el, i) => (el.innerHTML = this.originals[i]));
    [this.lines, this.words, this.chars, this.originals].forEach((arr) => (arr.length = 0));
    this.isSplit = false;
  }

  recursiveBalance(e) {
    e.normalize();
    toArray(e.childNodes).forEach((next) => {
      next.normalize();
      next.__lineParent = Boolean(next.tagName && next.hasChildNodes() && BLOCK_TAGS.includes(next.tagName));
      if (next.__lineParent && e?.__lineParent && !e.__isParent) {
        e.__lineParent = false;
      }
      this.recursiveBalance(next);
    });
  }

  recursiveCheckLineParent(e, lineParents) {
    toArray(e.childNodes).forEach((next) => {
      if (next.__lineParent) {
        next.__idx = null;
        // check if the __lineParent element has a valid text node to split
        if (next.textContent.replace(/\s+/g, ' ').trim().length > 0) {
          next.__lines = [this.createLine()];
          lineParents.push(next);
        }
      }
      this.recursiveCheckLineParent(next, lineParents);
    });
  }

  balance(el) {
    // save all line parents
    this.lineParents = [];

    this.recursiveBalance(el);

    this.recursiveCheckLineParent(el, this.lineParents);

    let useParent = true;
    if (!this.lineParents.length) {
      this.lineParents.push(el);
      el.__lines = [this.createLine()];
      el.__lineParent = true;
      el.__idx = null;
      useParent = false;
    }

    el.__lineParent = true;

    if (!this.options.noBalance) {
      this.lineParents.forEach((e) =>
        relayout({
          el: e,
          ratio: this.options.balanceRatio,
          useParent,
        })
      );
    }
  }

  recursiveFindBr(e, brs, onlyNew = true) {
    e.normalize();
    toArray(e.childNodes).forEach((next) => {
      if (next.tagName === 'BR' && (onlyNew ? !next.__newBR : true)) brs.push(next);
      else this.recursiveFindBr(next, brs, onlyNew);
    });
  }

  findAllBr(el, onlyNew = true) {
    const brs = [];

    this.recursiveFindBr(el, brs, onlyNew);

    return brs;
  }

  splitBr(el) {
    let j = 0;
    const brs = this.findAllBr(el);
    while (j < brs.length) {
      let i = 0;
      let parent = brs[j++].parentElement;

      if (!parent) return this.splitBr(el);

      while (!parent.__lineParent) {
        if (i++ >= 100) return;
        if (!parent.parentElement) return this.splitBr(el);
        const cloneInnerHTML = parent.innerHTML;
        const parentClone = parent.cloneNode();
        const parentTagName = parentClone.tagName.toLowerCase();
        const cloneOuterHTML = parentClone.outerHTML.split(`</${parentTagName}>`).join('');
        const newInnerHTML = cloneInnerHTML.split(/<br\b[^>]*>/).join(`</${parentTagName}><br>${cloneOuterHTML.trim()}`);
        parent = parent.parentElement;
        parent.innerHTML = parent.innerHTML.replace(cloneInnerHTML.trim(), newInnerHTML.trim());
        toArray(parent.childNodes).forEach((child) => {
          if (child.tagName === 'BR') child.__newBR = true;
          else if (child.nodeType !== 3 && child.textContent.trim().length === 0) child.remove();
        });
      }
    }
  }

  isNextBr(el) {
    return el.nextElementSibling?.tagName === 'BR';
  }

  isPrevBr(el) {
    return el.previousElementSibling?.tagName === 'BR';
  }

  attachBr(_, els) {
    let prevLineParent;
    let prevTop = els[0]?.__top || 0;
    els.forEach((w, i) => {
      const prevEl = els[i - 1];

      if (prevTop !== w.__top && prevEl) {
        const lineParent = this.findLineParent(w);
        if (!lineParent.__idx) lineParent.__idx = `l${w.__top}`;

        if (!this.isPrevBr(w.parentElement) && !this.isPrevBr(w) && !this.isNextBr(prevEl) && (!prevLineParent || prevLineParent?.__idx === lineParent.__idx)) {
          w.insertAdjacentHTML('beforebegin', '<br>');
        }
        prevLineParent = lineParent;
        prevTop = w.__top;
      }
    });
  }

  findLineParent(el) {
    let parent = el.parentElement;
    let found = false;
    while (!found) {
      if (parent.__lineParent) found = parent;
      parent = parent.parentElement;
    }
    return found;
  }

  replaceWords(element, notByChars) {
    Array.from(element.getElementsByClassName('word')).forEach((el, i) => {
      el.replaceWith(this.words[i]);
      if (el.__isCJT && notByChars) {
        this.words[i].innerHTML = this.words[i].textContent;
      }
    });
  }

  // CJT locales + Thai
  isCJTChar(char) {
    return /[\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u0E00-\u0E7F]/.test(char);
  }

  handleRawElement(parentEl, el, key, splitOn, preserveWhitespace, elements, allElements) {
    // Get the text to split
    const wholeText = el.wholeText || '';
    let contents = wholeText;

    // If there's no text after removing all whitespace, preserve the original whitespace
    if (!contents.trim().length) {
      allElements.push(document.createTextNode(wholeText));
      return;
    }

    // If we're splitting into words/chars, trim the content but preserve spaces
    if (key === 'word' || key === 'char') {
      contents = wholeText.trim();
      // Preserve leading whitespace
      if (SPACES.includes(wholeText[0])) {
        allElements.push(document.createTextNode(wholeText[0]));
      }

      if (this.options.handleCJT && key === 'word') {
        // Split text into words first
        const words = contents.split(/(\s+)/).filter(Boolean);

        for (let i = 0; i < words.length; i++) {
          const word = words[i];

          // If it's a whitespace, preserve it
          if (/^\s+$/.test(word)) {
            allElements.push(document.createTextNode(word));
            continue;
          }

          // Process each character in the word
          let currentWord = '';
          let isCJTMode = false;

          for (let j = 0; j < word.length; j++) {
            const char = word[j];
            const isCurrentCharCJT = this.isCJTChar(char);

            // Mode switch or end of word
            if (isCurrentCharCJT !== isCJTMode || j === word.length - 1) {
              // Add the current character to the word
              if (j === word.length - 1) {
                currentWord += char;
              }

              // Create element if we have accumulated text
              if (currentWord) {
                const splitEl = this.createElement(parentEl, key, currentWord);
                elements.push(splitEl);
                allElements.push(splitEl);

                // If it's CJT, split into individual characters
                if (isCJTMode) {
                  splitEl.__isCJT = true;
                  this.chars.push(...this.splitElement(splitEl, 'char', '', false));
                }
              }

              // Reset for next segment
              currentWord = j === word.length - 1 ? '' : char;
              isCJTMode = isCurrentCharCJT;
            } else {
              currentWord += char;
            }
          }
        }
      } else {
        // Regular handling for non-CJT text or when handleCJT is false
        if (key === 'char') {
          // Use Array.from to properly split Unicode characters including emojis
          const chars = Array.from(contents);
          chars.forEach((char) => {
            const splitEl = this.createElement(parentEl, key, char);
            elements.push(splitEl);
            allElements.push(splitEl);
          });
        } else {
          // Split content preserving all whitespace
          const parts = contents.split(/([\s\u00A0\u202F]+)/);
          parts.forEach((part, i) => {
            if (i % 2 === 1) {
              // Odd indices are whitespace - preserve them exactly
              allElements.push(document.createTextNode(part));
            } else if (part) {
              // Even indices are words - process them
              const splitEl = this.createElement(parentEl, key, part);
              elements.push(splitEl);
              allElements.push(splitEl);
            }
          });
        }
      }

      // insert trailing space if there was one and preserve &nbsp;
      if (SPACES.includes(wholeText[wholeText.length - 1])) {
        allElements.push(document.createTextNode(wholeText[wholeText.length - 1]));
      }
    }
  }

  splitElement(el, key, splitOn, preserveWhitespace) {
    // Combine any strange text nodes or empty whitespace.
    el.normalize();

    // Use fragment to prevent unnecessary DOM thrashing.
    const elements = [];
    const F = document.createDocumentFragment();

    const allElements = [];

    toArray(el.childNodes).forEach((next) => {
      if (next.tagName && !next.hasChildNodes()) {
        // keep elements without child nodes (no text and no children)
        return allElements.push(next);
      }

      // Recursively run through child nodes
      if (next.childNodes.length) {
        allElements.push(next);
        elements.push(...this.splitElement(next, key, splitOn, preserveWhitespace));
      } else {
        this.handleRawElement(F, next, key, splitOn, preserveWhitespace, elements, allElements);
      }
    });

    allElements.forEach((e) => F.appendChild(e));

    // Clear out the existing element
    el.innerHTML = '';
    el.appendChild(F);

    return elements;
  }

  offsetTop(el, offsetParent) {
    let offsetGrandparent = offsetParent.offsetParent;
    let top = 0;
    let p = el;
    while (p && p !== offsetParent && p !== offsetGrandparent) {
      top += p.offsetTop;
      p = p.offsetParent;
    }
    return top;
  }

  // if you ever get odd line breaks try increasing lineThreshold which is 0.2 by default which means "20% of the font-size"
  detectLinesTop(el, els, lineThreshold) {
    let lineOffsetY = -999;

    const computedStyle = window.getComputedStyle(el);
    const fontSize = parseFloat(computedStyle['fontSize'] || 0);
    const threshold = fontSize * lineThreshold;

    const result = els.map((e) => {
      const top = Math.round(this.offsetTop(e, el));
      if (Math.abs(top - lineOffsetY) > threshold) lineOffsetY = top;
      e.__top = lineOffsetY;
      return e.__top;
    });

    return [...new Set(result)]; // deduplicate result
  }

  splitLines(el) {
    const lines = [];

    const brs = this.findAllBr(el, false);

    brs.forEach((br) => {
      const lineParent = this.findLineParent(br);
      const line = this.createLine();
      line.__isLine = true;
      lineParent?.__lines?.push(line);
    });

    let globalLineIndex = 0;
    this.lineParents.forEach((lp, i) => {
      let lineIndex = 0;
      if (i > 0) globalLineIndex++;
      toArray(lp.childNodes).forEach((next) => {
        if (next.tagName === 'BR') {
          globalLineIndex++;
          lineIndex++;
          next.remove();
        } else {
          lp.__lines[lineIndex].appendChild(next);
          toArray(next.childNodes).forEach((e) => (e.__lineIndex = globalLineIndex));
          next.__lineIndex = globalLineIndex;
        }
      });
      lp.__lines.forEach((line) => lp.appendChild(line));
      lines.push(...lp.__lines);
    });

    lines.forEach((line) => {
      line.__words = toArray(line.getElementsByClassName('word'));
      line.__wordCount = line.__words.length;
    });

    return lines;
  }

  createLine(parent) {
    const line = document.createElement('span');
    line.style.setProperty('display', 'block');
    line.className = 'line';
    return parent ? parent.appendChild(line) : line;
  }

  createElement(parent, key, text) {
    const el = document.createElement('span');
    el.style.setProperty('display', 'inline-block');
    el.className = key;
    el.textContent = text;
    el.setAttribute('aria-hidden', true);
    return parent.appendChild(el);
  }

  checkMinLines(element, els) {
    if (this.options.minLines <= 1 || (this.options.minLines > 1 && els.length <= 1)) return true;
    let lineTop = els[0].__top,
      linesCount = 1;

    els.forEach((a) => {
      const top = a.__top;
      if (top > lineTop) {
        lineTop = top;
        linesCount++;
      }
    });

    const diff = this.options.minLines - linesCount;
    if (diff > 1 && !this.warned) {
      this.warned = true;
      console.warn(`SplitText is ran ${diff} times. Careful as this option might be expensive 🫰`.toUpperCase(), element);
    }

    const word = this.words[this.words.length - 1];
    let x = word.offsetLeft + word.offsetWidth * 0.9;
    if (element.offsetWidth < x) {
      x = element.offsetWidth - word.offsetWidth * 0.5;
    }
    if (linesCount < this.options.minLines && x > 0) {
      element.style.width = `${x}px`;

      this.revert();
      this.balance(element);
      this.split();

      return false;
    }

    return true;
  }
}
