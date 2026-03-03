export function patchRenderEquipment (ctx){
ctx.patch( BaseManager,'computeAllStats').after(function (_) {
game?.construction?.onEquipmentChange();
});
  
}