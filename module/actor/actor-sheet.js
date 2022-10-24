import { regenerateActor } from '../character-generator.js'
import { evaluateFormula, getInfoFromDropData } from '../utils.js'

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class EternalHungerActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["eternalhunger", "sheet", "actor"],
      template: "systems/eternalhunger/templates/actor/actor-sheet.html",
      width: 480,
      height: 640,
      tabs: [
        {
          navSelector: ".tabs",
          contentSelector: ".content",
          initial: "items",
        },
      ],
      dragDrop: [{ dragSelector: ".eternalhunger-items-list-row", dropSelector: null }],
    });
  }

  get template() {
    const path = "systems/eternalhunger/templates/actor";
    return `${path}/${this.actor.type}-sheet.html`;
  }

  /** @override */
  getData() {
    const data = super.getData();
    data.items = data.items.sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0
    );
    data.items = data.items.sort((a, b) =>
      a.system.equipped && !b.system.equipped ? -1 : a.system.equipped === b.system.equipped ? 0 : 1
    );    
    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) {
      return;
    }

    // Add inventory item
    html.find(".item-create").click(this._onItemCreate.bind(this));

    // Update inventory item
    html.find(".item-edit").click((ev) => {
      const li = $(ev.currentTarget).parents(".eternalhunger-items-list-row");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete inventory item
    html.find(".item-delete").click((ev) => {
      const li = $(ev.currentTarget).parents(".eternalhunger-items-list-row");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    html.find(".item-toggle-equipped").click((ev) => {
      const li = $(ev.currentTarget).parents(".eternalhunger-items-list-row");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.update({'system.equipped': !item.system.equipped});
    });

    html.find(".item-add-quantity").click((ev) => {
      const li = $(ev.currentTarget).parents(".eternalhunger-items-list-row");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      if (item.system.weightless) {
        item.update({'system.quantity': item.system.quantity + 1});
      } else {
        item.update({'system.uses.value': Math.min(item.system.uses.value + 1, item.system.uses.max)});
      }      
    });

    html.find(".item-remove-quantity").click((ev) => {
      const li = $(ev.currentTarget).parents(".eternalhunger-items-list-row");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      if (item.system.weightless) {
        item.update({'system.quantity': Math.max(item.system.quantity - 1, 0)});
      } else {
        item.update({'system.uses.value': Math.max(item.system.uses.value - 1, 0)});
      } 
    });

    html.find(".roll-control").click(this._onRoll.bind(this));

    // Rollable abilities
    html.find(".resource-roll").click(this._onRollAbility.bind(this));

    // Rest restores HP
    html.find("#rest-button").click(async () => {
      // Someone DEPRIVED of a crucial need (e.g. food,water or warmth) cannot
      // benefit from RESTS
      if (!this.actor.system.deprived) {
        await this.actor.update({
          "system.hp.value": this.actor.system.hp.max,
        });
      }
    });

    html.find("#restore-abilities-button").click(async () => {
      if (!this.actor.system.deprived) {
        await this.actor.update({
          "system.abilities.STR.value": this.actor.system.abilities.STR.max,
        });
        await this.actor.update({
          "system.abilities.DEX.value": this.actor.system.abilities.DEX.max,
        });
        await this.actor.update({
          "system.abilities.WIL.value": this.actor.system.abilities.WIL.max,
        });
      }
    });

    html
      .find(".eternalhunger-item-title")
      .click((event) => this._onItemDescriptionToggle(event));

    html.find("#die-of-fate-button").click(async () => {
      const roll = await evaluateFormula("1d6");
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: "Die of Fate",
      });
    });
  }

  /* -------------------------------------------- */
  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const template = "systems/eternalhunger/templates/dialog/add-item-dialog.html";
    const content =  await renderTemplate(template);

    new Dialog({
      title: game.i18n.localize("ETERNALHUNGER.CreateItem"),
      content,
      buttons: {
        create: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("ETERNALHUNGER.CreateItem"),
          callback: (html) => {
            const form = html[0].querySelector("form");
            if (form.itemname.value.trim() !== '') {
              this.actor.createOwnedItem({
                name: form.itemname.value,
                type: form.itemtype.value
              });
            }
          }
        },
      },
      default: "create"
    }).render(true);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    if (dataset.roll) {
      const roll = await evaluateFormula(dataset.roll, this.actor.getRollData());
      const label = dataset.label ? game.i18n.localize("ETERNALHUNGER.Rolling") + ` ${dataset.label}` : "";
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
      });
    }
  }

  _onItemDescriptionToggle(event) {
    event.preventDefault();
    const boxItem = $(event.currentTarget).parents(".eternalhunger-items-list-row");
    const item = this.actor.items.get(boxItem.data("itemId"));
    if (boxItem.hasClass("expanded")) {
      const summary = boxItem.children(".item-description");
      summary.slideUp(200, () => summary.remove());
    } else {
      const div = $(
        `<div class="item-description">${item.system.description}</div>`
      );
      boxItem.append(div.hide());
      div.slideDown(200);
    }
    boxItem.toggleClass("expanded");
  }

  async _onRollAbility(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    if (dataset.roll) {
      const roll = await evaluateFormula(dataset.roll, this.actor.getRollData());
      const label = dataset.label ? game.i18n.localize("ETERNALHUNGER.Rolling") + ` ${dataset.label}` : "";
      const rolled = roll.terms[0].results[0].result;
      const result = roll.total === 0 ? "Fail" : "Success"; // TODO Localize
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        content: `<div class="dice-roll"><div class="dice-result"><div class="dice-formula">${roll.formula}</div><div class="dice-tooltip" style="display: none;"><section class="tooltip-part"><div class="dice"><header class="part-header flexrow"><span class="part-formula">${roll.formula}</span></header><ol class="dice-rolls"><li class="roll die d20">${rolled}</li></ol></div></section></div><h4 class="dice-total failure">${result} (${rolled})</h4</div></div>`,
      });
    }
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onRegenerateCharacter(event) {
    event.preventDefault();

    const confirm = await Dialog.confirm({
      title: game.i18n.localize("ETERNALHUNGER.CharacterRegeneratorTitle"),
      content: `<p>${game.i18n.localize("ETERNALHUNGER.CharacterRegeneratorConfirm")}</p>`,
      defaultYes: false,
    });

    if (confirm) {
      await regenerateActor(this.actor);
    }
  }

  /** @override */
  _getHeaderButtons() {
    if (this.actor.type === 'character') {
      return [
        {
          class: `regenerate-character-button-${this.actor.id}`,
          label: game.i18n.localize("ETERNALHUNGER.RegenerateCharacter"),
          icon: "fas fa-skull",
          onclick: this._onRegenerateCharacter.bind(this),
        },
        ...super._getHeaderButtons(),
      ];
    } else {
      return super._getHeaderButtons();
    }
  }


  /**
   * @override
   *
   * @param {DragEvent} event
   * @param {Object} itemData
   */
  async _onDropItem(event, itemData) {
    const item = ((await super._onDropItem(event, itemData)) || []).pop();
    if (!item) return;

    const { item: originalItem, actor: originalActor } = await getInfoFromDropData(itemData);

    if (originalItem) {
      await originalActor.deleteEmbeddedDocuments("Item", [originalItem.id]);
    }
  }
}
