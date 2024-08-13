import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import store from '~/store';

export default function SetLanguage() {
  const [lang] = useRecoilState(store.lang);
  var lang_local = '';
  if (navigator.languages.length > 1) {
    if (navigator.languages[0].startsWith('zh')) {
      lang_local = 'zh-CN';
    } else {
      lang_local = navigator.languages[0].substring(0, 2);
    }
  } else {
    lang_local = 'zh-CN';
  }
  const languageCode = lang || lang_local;

  useEffect(() => {
    if (languageCode) {
      window.localStorage.setItem('lang', languageCode);
    }
  }, [lang, languageCode]);

  return null;
}
