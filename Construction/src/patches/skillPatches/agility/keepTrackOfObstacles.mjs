export function keepTrackOfObstacles({ patch }) {
    patch(Agility, 'viewObstacleSelectionOnClick').replace(function(_, category){
     var _a, _b;
        const course = this.activeCourse;
        if (!this.isSlotUnlocked(course.obstacleSlots[category]))
            return;
        const obstacleSelection = this.actions.filter((obstacle) => obstacle.category === category && obstacle.course === course && (obstacle._namespace.name !== "rielkConstruction" || obstacle.category / 2 <= this.game.construction.fixtures.getObjectSafe("rielkConstruction:Jungle_Gym").currentTier- 1) );
        // Generate new selection menus as required
        this.createSelectionMenus(obstacleSelection.length);
        agilityObstacleSelectMenus.forEach((menu, i) => {
            if (i < obstacleSelection.length) {
                showElement(menu);
                menu.setObstacle(obstacleSelection[i]);
            }
            else {
                hideElement(menu);
            }
        });
        (_a = document.getElementById('build-pillar-info')) === null || _a === void 0 ? void 0 : _a.classList.replace('d-flex', 'd-none');
        (_b = document.getElementById('build-obstacle-info')) === null || _b === void 0 ? void 0 : _b.classList.replace('d-none', 'd-flex');
        document.getElementById('select-agility-obstacle-type').textContent = getLangString('MENU_TEXT_SELECT_OBSTACLE');
        $('#modal-select-agility-obstacle').modal('show');
    })
   
}
