import { useEffect } from 'react';

const AUTO_SCROLL_THRESHOLD_PX = 100; // Increased threshold

export function useAutoScroll(scrollContentContainer?: Element | null) {
  useEffect(() => {
    function scrollToBottom() {
      if (!scrollContentContainer) return;

      const distanceFromBottom =
        scrollContentContainer.scrollHeight -
        scrollContentContainer.clientHeight -
        scrollContentContainer.scrollTop;

      // Scroll if near bottom OR if at very top (initial load / empty)
      if (distanceFromBottom < AUTO_SCROLL_THRESHOLD_PX || scrollContentContainer.scrollTop === 0) {
        scrollContentContainer.scrollTo({
          top: scrollContentContainer.scrollHeight,
          behavior: 'smooth',
        });
      }
    }

    if (scrollContentContainer && scrollContentContainer.firstElementChild) {
      const resizeObserver = new ResizeObserver(scrollToBottom);

      resizeObserver.observe(scrollContentContainer.firstElementChild);

      // Delay initial scroll to ensure layout is ready
      setTimeout(scrollToBottom, 100);

      return () => resizeObserver.disconnect();
    }
  }, [scrollContentContainer]);
}
