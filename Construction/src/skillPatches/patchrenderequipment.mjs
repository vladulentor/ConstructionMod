export function patchRenderEquipment (ctx){
ctx.patch( Player,'updateForEquipmentChange').after(function (_) {
game?.construction?.onEquipmentChange();
});
  
}