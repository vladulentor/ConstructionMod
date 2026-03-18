
export class WeaponCondition extends BooleanCondition {
  constructor(data) {
    super(data);
    this.type = 'Weapon';
    this.weapon = data.weapon;
  }

  _checkIfMet(manager) {
    const weapon = game.combat.player.equipment.getItemInSlot("melvorD:Weapon");
    return weapon._localID === this.weapon;
  }

  _assignWrappedHandler(manager, handler) {
        manager.player.on('equipmentChanged', handler);
  }

  _unassignWrappedHandler(manager, handler) {
        manager.player.off('equipmentChanged', handler);
  }

  addTemplateData(templateData, prefix = '', postfix = '') {  }
}