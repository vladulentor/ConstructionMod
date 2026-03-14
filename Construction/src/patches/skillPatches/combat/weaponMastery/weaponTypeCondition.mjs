
export class WeaponTypeCondition extends BooleanCondition {
  constructor(data) {
    super(data);
    this.type = 'WeaponType';
    this.weaponType = data.weaponType;
  }

  _checkIfMet(manager) {
 
    const weapon = game.combat.player.equipment.getItemInSlot("melvorD:Weapon")?.item;
    return weapon?.weaponType?._localID === this.weaponType;
  }

  _assignWrappedHandler(manager, handler) {
        manager.player.on('equipmentChanged', handler);
  }

  _unassignWrappedHandler(manager, handler) {
        manager.player.off('equipmentChanged', handler);
  }

  addTemplateData(templateData, prefix = '', postfix = '') {  }
}