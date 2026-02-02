// Dashboard theme toggle: light (default) / dark
(function(){
  const KEY = 'dashboardTheme';
  const BTN_ID = 'themeToggle';
  const ICON_ID = 'themeToggleIcon';

  function applyTheme(theme){
    if(theme === 'dark'){
      document.body.setAttribute('data-dashboard-theme','dark');
    } else {
      document.body.setAttribute('data-dashboard-theme','light');
    }
    updateIcon(theme);
  }

  function updateIcon(theme){
    const icon = document.getElementById(ICON_ID);
    if(!icon) return;
    if(theme === 'dark'){
      icon.className = 'fas fa-sun';
      icon.title = 'Switch to light mode';
    } else {
      icon.className = 'fas fa-moon';
      icon.title = 'Switch to dark mode';
    }
  }

  function toggleTheme(){
    const cur = localStorage.getItem(KEY) || 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    localStorage.setItem(KEY, next);
    applyTheme(next);
  }

  document.addEventListener('DOMContentLoaded', function(){
    const saved = localStorage.getItem(KEY) || 'light';
    applyTheme(saved);
    const btn = document.getElementById(BTN_ID);
    if(btn) btn.addEventListener('click', toggleTheme);
  });
})();
