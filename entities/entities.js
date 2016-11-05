// Assignment 10
// Student: Kristinn Heiðar Freysteinsson
// Email: kristinnf13@ru.is

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		validate: function(n) {
			return n !== null && n.length;
		}
	},
	token: {
		type: String,
		required: true,
		unique: true
	},
	gender: {
		type: String,
		match: /^(m|f|o)$/
	}
},{
	versionKey: false
});

const CompanySchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	punchCount: {
		type: Number,
		min: 2,
		default: 10
	}
},{
	versionKey: false
});

const PunchSchema = new mongoose.Schema({
	company_id: {
		type: String,
		required: true
	},
	user_id: {
		type: String,
		required: true
	},
	created: {
		type: Date,
		default: new Date()
	},
	used: {
		type: Boolean,
		default: false
	}
},{
	versionKey: false
});

const UserEntity = mongoose.model("User", UserSchema);
const CompanyEntity = mongoose.model("Company", CompanySchema);
const PunchEntity = mongoose.model("Punch", PunchSchema);

module.exports = {
	Users: UserEntity,
	Companies: CompanyEntity,
	Punches: PunchEntity
};
