'use client';

import { useEffect } from 'react';

export default function DisableRightClick() {
  useEffect(() => {
    // 키보드 단축키 차단
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 (개발자 도구)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Ctrl + Shift + I (개발자 도구)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }

      // Ctrl + Shift + J (콘솔)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }

      // Ctrl + U (소스 보기)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }

      // Ctrl + A (전체 선택) - 선택적으로 차단
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        return false;
      }

      // Ctrl + S (저장) - 선택적으로 차단
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
      }

      // Ctrl + P (인쇄) - 선택적으로 차단
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        return false;
      }
    };

    // 우클릭 메뉴 차단 (추가 보완)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 드래그 앤 드롭 차단
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // 텍스트 선택 차단
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, []);

  return null;
}
