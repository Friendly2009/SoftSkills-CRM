function googleTranslateElementInit() {
  let loading = false;
  let initial = localStorage.getItem("initial-alfacrm");

  try {
    initial = JSON.parse(initial);
  } catch {
    initial = false;
  }

  if (window.location.hostname.match("\\w+(.com)") && !initial) {
    localStorage.setItem("initial-alfacrm", JSON.stringify(true));
    localStorage.setItem("lang-local", JSON.stringify("en"));
  }

  if (!loading) {
    let SetTimeoutFc = setInterval(() => {
      var ggl = new google.translate.TranslateElement(
        { pageLanguage: "ru" },
        "google_translate_element",
      );
      window.ggl = ggl;
      loading = true;
    }, 20);
  }

  if (loading) {
    setTimeout(() => clearInterval(SetTimeoutFc), 5000);
  }
}
