import {glyphs, userStore} from '../stores/creation.stores.jsx';
import {AppValues, AccountValues, FontValues, FontInfoValues} from '../services/values.services.js';
import {loadFontValues} from './loadValues.helpers.js';
import {setupFontInstance} from './font.helpers.js';
import LocalClient from '../stores/local-client.stores.jsx';
import HoodieApi from '../services/hoodie.services.js';
import slug from 'slug';
slug.defaults.mode = 'rfc3986';
slug.defaults.modes.rfc3986.remove = /[-_\/\\\.]/g;

let localClient;

window.addEventListener('fluxServer.setup', () => {
	localClient = LocalClient.instance();
});

const defaultAccountValues = {
	firstname: 'there',
};

const defaultValues = {
		values: {
			mode: ['glyph', 'word', 'text'],
			selected: 'A'.charCodeAt(0).toString(),
			onboard: false,
			onboardstep: 'welcome',
			word: 'Hello',
			text: 'Type any text here and preview your modifications in real time! Curabitur blandit tempus porttitor. Maecenas sed diam eget risus varius blandit sit amet non magna. Sed posuere consectetur est at lobortis. Etiam porta sem malesuada magna mollis euismod. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nulla vitae elit libero, a pharetra augue. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Vestibulum id ligula porta felis euismod semper. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Cras mattis consectetur purus sit amet fermentum. Cras mattis consectetur purus sit amet fermentum. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Donec sed odio dui.',
			pos: ['Point', 457, -364],
			familySelected: {
				template: 'venus.ptf',
			},
			variantSelected: {
				db: 'venus',
			},
			savedSearch: [],
		},
};

function mapGlyphForApp(glyph) {
	return _.map(
		glyph,
		(alt) => {
			return {
				src: {
					tags: alt.src && alt.src.tags || [],
					characterName: alt.src && alt.src.characterName || '',
					unicode: alt.src && alt.src.unicode	|| '',
					glyphName: alt.src && alt.src.glyphName || '',
				},
				name: alt.name,
				altImg: alt.altImg,
			};
		}
	);
}

export async function loadStuff() {
	//We need to fix database names for the change to normal hoodie api so let's go

	let oldAppValues;
	try {
		oldAppValues = await AppValues.getWithPouch({typeface: 'default'});
		//Login checking and app and font values loading

		if (oldAppValues.values.library.length > 0 && !oldAppValues.values.switchedToHoodie) {
			oldAppValues.values.library.forEach(({variants}) => {
				variants.forEach(async (variant) => {
					const newDb = slug(variant.db, '');
					if (newDb !== variant.db) {
						variant.db = newDb;

						//Here we copy the old db to the new db with slugified name
						const oldFontValues = await FontValues.getWithPouch({typeface: variant.db});
						const oldFontInfosValues = await FontInfoValues.getWithPouch({typeface: variant.db});

						await FontValues.save({
							typeface: newDb,
							values: oldFontValues.values,
						});
						await FontInfoValues.save({
							typeface: newDb,
							values: oldFontInfosValues.values,
						});
					}
				});
			});
			oldAppValues.values.switchedToHoodie = true;
			await AppValues.save({typeface: 'default', values: oldAppValues.values});
		}
	}
	catch (err) {
		console.log(err);
	}

	let appValues;

	try {
		appValues = oldAppValues ? oldAppValues : await AppValues.get({typeface: 'default'});
		appValues.values = _.extend(defaultValues.values, appValues.values);
	}
	catch (err) {
		appValues = defaultValues;
		console.error(err);
	}
	localClient.dispatchAction('/load-app-values', appValues);

	let accountValues;
	let customerValues;

	try {
		accountValues = await AccountValues.get({typeface: 'default'});
		accountValues = _.extend(defaultAccountValues, accountValues);
	}
	catch (err) {
		accountValues = defaultAccountValues;
	}

	/*try {
		customerValues = await HoodieApi.getCustomerInfo();
	}
	catch (err) {
		customerValues = {};
		}*/
	localClient.dispatchAction('/load-account-values', accountValues);

	let typedata;

	try {
		const fontResult = await setupFontInstance(appValues);

		typedata = fontResult.typedata;
	}
	catch (err) {
		console.log(err);
	}

	localClient.dispatchAction('/create-font', fontInstance.font.ot.getEnglishName('fontFamily'));
	localClient.dispatchAction('/load-params', {controls: typedata.controls, presets: typedata.presets});
	localClient.dispatchAction('/load-glyphs', _.mapValues(
		fontInstance.font.altMap,
		mapGlyphForApp
	));
	localClient.dispatchAction('/load-tags', typedata.fontinfo.tags);
	localClient.dispatchAction('/load-commits');
	fontInstance.displayChar(String.fromCharCode(glyphs.get('selected')));

	loadFontValues(typedata, appValues.values.variantSelected.db);
}