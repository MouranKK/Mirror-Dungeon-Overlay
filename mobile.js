// R34：浏览器里打开（没有电脑版的窗口接口）时加 mdWeb。
// 手机（窄屏或触屏小屏）→ mdPhone：底部换层、大按钮；电脑浏览器（宽屏，或打开 pc.html）→ mdPC：居中一栏。
(function(){
 if(typeof window==='undefined'||window.MD_WINDOW||typeof document==='undefined'||!document.documentElement)return;
 const h=document.documentElement;h.classList.add('mdWeb');
 const forcePC=/pc\.html$/i.test(location.pathname);
 const pick=()=>{const touch=matchMedia('(pointer:coarse)').matches;const phone=!forcePC&&(innerWidth<700||(touch&&Math.min(innerWidth,innerHeight)<700));h.classList.toggle('mdPhone',phone);h.classList.toggle('mdPC',!phone)};
 pick();addEventListener('resize',pick);
})();
