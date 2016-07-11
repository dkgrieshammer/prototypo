import React from 'react';
import Lifespan from 'lifespan';

import LocalClient from '../stores/local-client.stores.jsx';

import DeleteParamGroup from './delete-param-group.components.jsx';
import EditParamGroupPanel from './edit-param-group-panel.components.jsx';
import GlyphGrid from './glyph-grid.components.jsx';

export default class EditParamGroup extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			selected: [],
		};

		// function binding
		this.selectGroup = this.selectGroup.bind(this);
		this.deleteGroup = this.deleteGroup.bind(this);
		this.editGroup = this.editGroup.bind(this);
		this.createNewGroup = this.createNewGroup.bind(this);
	}

	componentWillMount() {
		this.client = LocalClient.instance();
		this.lifespan = new Lifespan();

		this.client.getStore('/prototypoStore', this.lifespan)
			.onUpdate(({head}) => {
				this.setState({
					tags: head.toJS().tags,
					currentGroup: head.toJS().indivCurrentGroup,
					groups: head.toJS().indivGroups,
					preDelete: head.toJS().indivPreDelete,
					editGroup: head.toJS().indivEditGroup,
					glyphs: head.toJS().indivSelected,
					grid: head.toJS().indivGlyphGrid,
					tagSelected: head.toJS().indivTagSelected,
					otherGroups: head.toJS().indivOtherGroups,
					errorEdit: head.toJS().indivErrorEdit,
				});
			})
			.onDelete(() => {
				this.setState(undefined);
			});
	}

	componentWillUnmount() {
		this.lifespan.release();
	}

	selectGroup(e) {
		this.client.dispatchAction('/select-indiv-group', e.target.value);
	}

	deleteGroup() {
		this.client.dispatchAction('/pre-delete', true);
	}

	editGroup() {
		this.client.dispatchAction('/edit-param-group', true);
	}

	createNewGroup() {
		this.client.dispatchAction('/create-mode-param-group');
	}

	render() {
		const options = _.map(this.state.groups, (group) => {
				return <option value={group} key={group}>{group}</option>;
		});

		const deletePanel = this.state.preDelete
			? <DeleteParamGroup glyphs={this.state.glyphs} groupName={this.state.currentGroup}/>
			: false;

		const editPanel = this.state.editGroup
			? <EditParamGroupPanel errorEdit={this.state.errorEdit} glyphsInOther={this.state.otherGroups} glyphs={this.state.glyphs} groupName={this.state.currentGroup}/>
			: false;

		const glyphGrid = this.state.grid ? (
			<GlyphGrid
				otherGroups={this.state.otherGroups}
				tagSelected={this.state.tagSelected}
				selected={this.state.glyphs}
				tags={this.state.tags}/>
		) : false;

		return (
			<div className="edit-param-group">
				Editing
				<select onChange={this.selectGroup} value={this.state.currentGroup} className="edit-param-group-select">
					{options}
				</select>
				<span className="edit-param-group-button alert" onClick={this.deleteGroup}>DELETE</span>
				<span className="edit-param-group-button" onClick={this.editGroup}>EDIT</span>
				<span className="edit-param-group-button" onClick={this.createNewGroup}>CREATE NEW GROUP</span>
				{deletePanel}
				{editPanel}
				{glyphGrid}
			</div>
		);
	}
}
