    
    export function patchTokenDonation(ctx) {
        ctx.patch(ArchaeologyMuseum, 'donateAllGenericArtefacts').replace(function (o) {
        const { tokenGain } = this.getDonateGenericInfo();
        let tokensAdded = false;
        const bonus = this.game.modifiers.getValue("rielkConstruction:museumTokenDoubled", ModifierQuery.EMPTY);
            const multiplier = bonus === 1 ? 2 : 1;
        if (tokenGain > 0) {
            tokensAdded = this.game.bank.addItem(this._tokenItem, tokenGain * multiplier, false, true, false, true, `Skill.${this.archaeology.id}.MuseumDonation`);
        }
        else {
            tokensAdded = true;
        }
        if (tokensAdded) {
            const oldCount = this.donationCount;
            this.forEachGenericArtefactInBank((item, donateQuantity) => {
                this.game.bank.removeItemQuantity(item, donateQuantity, true);
                if (!this.isItemDonated(item)) {
                    this.donatedItems.add(item);
                }
            });
            if (oldCount !== this.donationCount) {
                this.giveUnawardedRewards();
                this.renderQueue.donationProgress = true;
                this._events.emit('itemDonated', new ArchaeologyItemDonatedEvent(oldCount, this.donationCount));
            }
        }
        else {
            bankFullNotify();
        }
    }

        )
        }
