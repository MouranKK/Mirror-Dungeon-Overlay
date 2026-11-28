// Verified game-mechanics corrections; creator route opinions remain separate.
(function(){
 const packs=window.MD_OVERLAY_KNOWLEDGE?.packs||{};
 const routes=window.MD_BURN_ROUTES||{};
 const fixed=['血腥味','紫色编码','身负重担者们','插翅虎','仲春夜之梦2','精灵童话','永劫的枷锁','去·海·边·激·蟹'];
 for(const name of fixed){if(!packs[name])continue;const p=packs[name];routes[name]={...(routes[name]||{}),goal:p.goal,event:p.event,shop:p.shop,warning:p.warning,layout:p.layout,priorityNode:p.priorityNode,gifts:p.gifts,reference:p.reference,audit:p.audit};}
 // The themes below had unverified event guarantees or incorrect terminology; show the verified pool instead.
 for(const name of ['信仰与侵蚀','时间杀人时间复刻','由子弹画下的句点','LCB定期体检复刻','无改变者','深夜清扫复刻','3号线']){
  if(!packs[name])continue;const p=packs[name];routes[name]={...(routes[name]||{}),event:p.event,warning:p.warning,gifts:p.gifts,reference:p.reference,audit:p.audit};
 }
 window.MD_BURN_ROUTES=routes;
})();
