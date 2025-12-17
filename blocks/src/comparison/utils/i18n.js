export const __ =
  window.wp?.i18n?.__ ??
  function (string) {
    return string;
  };
