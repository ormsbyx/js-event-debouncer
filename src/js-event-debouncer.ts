/**
 * Use EventDebouncer when you have a set of events that might all
 * occur within a certain duration of time and you only want to
 * allow the most important one to trigger its callback.
 *
 * Pass all options in the single options argument.
 * The options are:
 *   duration { number } required - milliseconds. the period during which
 *      triggered events will debounce. if you find your debounce is not
 *      functioning as you expect, increase your duration slightly. an
 *      initial good value might be 150 if you're looking to avoid multiple
 *      events from happening around the same time.
 *   heirarchy { string | string[] } - if string: the name of the
 *      event that will win-out over all others when multiple events are
 *      called within the duration period.
 *      if string[] - an array of strings representing a heirarchy of all
 *      events that you will push into the debouncer. the order in which
 *      they appear in the array determines their importance. events with
 *      lower index numbers take precedence.
 *   func { function } optional - a callback function that will be called
 *      whenever any event is allowed to happen. there is also a callback
 *      function that you can register will every call to the debouncer. it
 *      is these individual callback functions that are likely what you
 *      want to use with the EventDebouncer.  This optional callback applies
 *      to every event. use it as you see fit. or don't.
 *
 * Example usage:
 * // CREATING THE DEBOUNCED FUNCTION
 * const myEvtDeb = eventDebouncer({
 *    duration: 180,
 *    heirarchy: ["save", "keyup", "blur", "keydown"]
 * });
 * // USING THE DEBOUNCED FUNCTION
 * textfield.addEventListener('blur', () => { myEvtDeb('blur', this.validate); });
 * textfield.addEventListener('keyup', () => { myEvtDeb('keyup', this.handleNavigation); });
 * submitBtn.addEventListener('click', () => { myEvtDeb('save', this.formSave); });
 *
 * EXAMPLE USE CASE: You're focused in a textfield and you enter a value.
 * You then click the submit button to save the data. Normally, your blur event
 * would happen and trigger your this.validate function and then immediately,
 * your submit button would call your this.formSave function, which probably
 * also calls your validate function.  With EventDebouncer, the call to
 * validate that would happen because of the blur event would get debounced)
 * and only your formSave would happen.
 * EventDebouncing could be equally useful for a keyup -> blur sequence.
 *
 * Other uses: you could put an EventDebouncer on a search field to stop a
 * search api callback from happening any sooner than, say, every 3 seconds. Just
 * set the duration to 3000. This would force EventDebouncer to act like a
 * standard debounce function: useful if you don't have a utility library included
 * in your project. You will still need to set heirarchy to a single string and
 * then use that string as the event-name with every call to your custom debounce
 * function.
 *
 * STANDARD DEBOUNCE EXAMPLE:
 * const myStdDeb = eventDebouncer({
 *    duration: 3000,
 *    heirarchy: 'search'
 * });
 * tf.addEventListener('keyup', (e: KeyboardEvent) => {
 *    myEvtDeb('search', () => {
 *      this.callSearchApi(e.target.value)
 *    });
 * });
 *
 * Note: if you fail to use either the heirarchy option, every event will be
 * allowed (no debouncing will happen).
 *
 * @param { duration: number; heirarchy: string | string[]; func: Function; } options
 * @returns { Function } debounced function.
 */
export function eventDebouncer(options: {
  duration: number;
  heirarchy?: string[] | string;
  func?: Function;
}) {
  const { func: masterCallback, duration, heirarchy } = options;
  const noop = function () {};
  const boss = heirarchy && typeof heirarchy === "string" && heirarchy;
  let timeout: number | undefined;
  let lastEvent: string | undefined;
  if (!boss && !heirarchy) {
    console.warn("Error in EventDebouncer. Missing config. Review.");
  }

  return function (evt: string, callback: Function) {
    let evtIdx = -1;
    let lastIdx = -1;
    const effect = () => {
      timeout = undefined;
      lastEvent = undefined;
      (masterCallback || noop)();
      (callback || noop)();
    };
    if (boss) {
      if (evt !== boss && lastEvent === boss) {
        return;
      }
    } else if (heirarchy && heirarchy.length) {
      evtIdx = heirarchy.indexOf(evt);
      lastIdx = heirarchy.indexOf(lastEvent || "");
      if (lastIdx > -1 && lastIdx <= evtIdx) {
        return;
      }
    }
    clearTimeout(timeout);
    timeout = (setTimeout(effect, duration) as unknown) as number;
    if (evtIdx >= 0) lastEvent = evt;
  };
}
