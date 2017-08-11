# sequelize-markup

This is a Babel plugin that transpiles ident aware markup into a [Sequelize](http://docs.sequelizejs.com/) configuration and model definition.

## Features:

* Markup syntax for declaring models
* Declare models in a single file or in multiple files
* Connection configuration stored in a file or in code
* Multiple database environments

## Model in single file, with configuration in code:
###### src/index.js:
```javascript
// configure sequelize
var db = SQLZINIT>
    // sequelize configuration options
  (config)
      // "development" db environment
    (development(dialect="sqlite"))
      (storage="./db.development.sqlite")
    // "test" db environment
    (test)
      (dialect="sqlite")
  // execution environment
  (environment="development")

// configure models
SQLZ>
  (User)
    (name(type=DataTypes.STRING(60)))
    (...associations)
      (hasMany.Task)

  (Task)
    (title(type=DataTypes.STRING(255)))

// configure associations
SQLZINIT(db)

// create database and insert a record
db.sequelize.sync({ force: true }).then(() => {
  db.User.findOrCreate({ 
    where: { name: 'testuser' }, 
    defaults: { other: 'ok' } } )
    .spread( (user, wasCreated) => {
      console.log(user.get( { plain: true } ));
    });
});
```

###### Transpiles to:
###### src/index.js:
```javascript
var db = {};

var Sequelize = require("sequelize"),
  DataTypes = Sequelize.DataTypes,
  env = "development",
  cfg = {
    development: {
      dialect: "sqlite",
      storage: "./db.development.sqlite"
    },
    test: {
      dialect: "sqlite"
    }
  }[env],
  sequelize = new Sequelize(cfg);

db.sequelize = sequelize;
db.Sequelize = Sequelize;
const User = sequelize.define("User", {
  name: {
    type: DataTypes.STRING(60)
  }
});

User.associate = sequelize => {
  User.hasMany(sequelize.models.Task, {});
};

const Task = sequelize.define("Task", {
  title: {
    type: DataTypes.STRING(255)
  }
});

for (let mdl in sequelize.models) {
  let model = sequelize.models[mdl];
  db[mdl] = model;
  if (model.associate) model.associate(sequelize);
}

db.sequelize.sync({ force: true }).then(() => {
  db.User.findOrCreate({
    where: { name: 'testuser' },
    defaults: { other: 'ok' } }).spread((user, wasCreated) => {
      console.log(user.get({ plain: true }));
    });
});
```

## Models in multiple files with configuration in external file:
###### src/db/index.js:
```javascript
var path = require("path");

// configure sequelize and import models
var db = SQLZINIT>
  // path to configuration file
  (config=path.join(__dirname, "..", "..", "config", "config.json"))
  // execution environment
  (environment=process.env.NODE_ENV || "development")
  // optional database URL
  (url=process.env.DATABASE_URL)
  // model files glob
  (models=path.join(__dirname, "**/!(index).js"))

// configure associations
SQLZINIT(db);

module.exports = db;
```

###### src/db/user.js:
```javascript
export default function(sequelize, DataTypes) {
  SQLZ>
    (User)
      (name(type=DataTypes.STRING(60)))
      (...associations)
        (hasMany.Task)
}
```

###### src/db/task.js:
```javascript
export default function(sequelize, DataTypes) {
  SQLZ>
    (Task)
      (title(type=DataTypes.STRING(255)))
}
```

###### src/index.js:
```javascript
var path = require('path');
var db = require(path.join(__dirname, 'db'));

db.sequelize.sync({ force: true }).then(() => {
  db.User.findOrCreate({ 
    where: { name: 'testuser' }, 
    defaults: { other: 'ok' } } )
    .spread( (user, wasCreated) => {
      console.log(user.get( { plain: true } ));
    });
});
```

###### config/config.json
```json
{
  "development": {
    "dialect": "sqlite",
    "storage": "./db.development.sqlite"
  },
  "test": {
    "dialect": "sqlite",
    "storage": ":memory:"
  },
  "production": {
    "username": null,
    "password": null,
    "database": "database_production",
    "host": "127.0.0.1",
    "dialect": "mysql",
    "logging": false
  }
}
```
###### Transpiles to:

###### src/db/index.js:
```javascript
var path = require("path");

var db = {};

var Sequelize = require("sequelize"),
  DataTypes = Sequelize.DataTypes,
  env = process.env.NODE_ENV || "development",
  dbUrl = process.env.DATABASE_URL,
  cfgFile = path.join(__dirname, "..", "..", "config", "config.json"),
  cfg = require(cfgFile)[env],
  sequelize = dbUrl ? new Sequelize(dbUrl, cfg) : new Sequelize(cfg),
  glob = require("glob"),
  modelGlob = path.join(__dirname, "**/!(index).js"),
  files = glob.sync(modelGlob);

for (let i = 0; i < files.length; i++) sequelize.import(files[i]);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

for (let mdl in sequelize.models) {
  let model = sequelize.models[mdl];
  db[mdl] = model;
  if (model.associate) model.associate(sequelize);
}

module.exports = db;

```
###### src/db/user.js:
```javascript
export default function (sequelize, DataTypes) {
  const User = sequelize.define("User", {
    name: {
      type: DataTypes.STRING(60)
    }
  });

  User.associate = sequelize => {
    User.hasMany(sequelize.models.Task, {});
  };
}
```
###### src/db/task.js:
```javascript
export default function (sequelize, DataTypes) {
  const Task = sequelize.define("Task", {
    title: {
      type: DataTypes.STRING(255)
    }
  });
}
```

## Syntax

#### SQLZINIT>

The `SQLZINIT>` directive is used to declare a Sequelize configuration.  Indented child elements that follow this directive are used to create the configuration.

###### Example:
```javascript
var db = SQLZINIT>
  // path to configuration file
  (config=path.join(__dirname, "..", "..", "config", "config.json"))
  // execution environment
  (environment=process.env.NODE_ENV || "development")
  // optional database URL
  (url=process.env.DATABASE_URL)
  // optional model files glob
  (models=path.join(__dirname, "**/!(index).js"))
```
###### Transpiles to:
```javascript
var db = {}; 
var Sequelize = require("sequelize"),
  DataTypes = Sequelize.DataTypes,
  env = process.env.NODE_ENV || "development",
  dbUrl = process.env.DATABASE_URL,
  cfgFile = path.join(__dirname, "..", "..", "config", "config.json"),
  cfg = require(cfgFile)[env],
  sequelize = dbUrl ? new Sequelize(dbUrl, cfg) : new Sequelize(cfg),
  glob = require("glob"),
  modelGlob = path.join(__dirname, "**/!(index).js"),
  files = glob.sync(modelGlob);

for (let i = 0; i < files.length; i++) sequelize.import(files[i]);

db.sequelize = sequelize;
db.Sequelize = Sequelize;
```

#### (environment=*"name"*)
The `(environment="name")` element specifies which database environment Sequelize should use.  The value is used to select which configuration Sequelize uses.
```javascript
  (environment=process.env.NODE_ENV || "development")
```

#### (config=*"config.json"*)
The `(config="config.json")` element specifies a JSON file to load as the Sequelize configuration.  Each root key specifies a database environment.

Sample config.json file:
```json
{
  "development": {
    "dialect": "sqlite",
    "storage": "./db.development.sqlite"
  },
  "test": {
    "dialect": "sqlite",
    "storage": ":memory:"
  },
  "production": {
    "username": "user",
    "password": "pass",
    "database": "database_production",
    "host": "127.0.0.1",
    "dialect": "mysql",
    "logging": false
  }
}
```
#### (config)

To specify the Sequelize configuration inside a source file, use the `(config)` element:

###### Example:
```javascript
var db = SQLZINIT>
  // path to configuration file
  (config)
      (development)
          (dialect="sqlite")
          (storage="./db.development.sqlite")
        (test(dialect="sqlite", storage=":memory:"))
            (logging=false)
  // execution environment
  (environment=process.env.NODE_ENV || "development")
```
###### Transpiles to:
```javascript
var db = {};

var Sequelize = require("sequelize"),
  DataTypes = Sequelize.DataTypes,
  env = process.env.NODE_ENV || "development",
  cfg = {
    development: {
      dialect: "sqlite",
      storage: "./db.development.sqlite"
    },
    test: {
      dialect: "sqlite",
      storage: ":memory:",
      logging: false
    }
  }[env],
  sequelize = new Sequelize(cfg);

db.sequelize = sequelize;
db.Sequelize = Sequelize;
```
Note that you can specify keys and values as element attributes or child elements.

#### (url=*"database URL"*)
Use the optional `(url="database URL")` element to declare a URL to use when connecting to the database.  This allows for an environment variable to decide which database connection is used.
```javascript
(url=process.env.DATABASE_URL)
```

#### (models=*"glob"*)
The optional `(models="glob")` element uses the [glob](https://www.npmjs.com/package/glob) package to import models contained in files that recursively match the wildcard pattern.
```javascript
// model files glob (all but index.js)
(models=path.join(__dirname, "**/!(index).js"))
```

#### SQLZINIT(*db*)
After models have been defined and/or imported, use `SQLZINIT(db)` to initialize all model assocations.

###### Example:
```javascript
SQLZINIT(db) // use the variable that SQLZINIT> assigns to.
```
###### Transpiles to:
```javascript
for (var mdl in sequelize.models) {
  var model = sequelize.models[mdl];
  db[mdl] = model;
  if (model.associate) model.associate(sequelize);
}
```
#### SQLZ>

One or more tables are defined using `SQLZ>`.  This will transpile the child elements that follow into Sequelize calls.

Root nodes map to database tables.  Child nodes map to either columns or table options.  Table options are declared using one of the following elements: `(...options)`, `(...name)`, `(...columns)`, `(...getters)`, `(...setters)`, `(...validate)`, `(...indexes)`, `(...associations)`

###### Example:
```javascript
SQLZ>
    (Table1)
      (Column1(type=DataTypes.STRING))
      (Column2(type=DataTypes.STRING))
      (...columns) // can also specify columns here
        (AnotherColumn1(type=DataTypes.STRING))
      (...name)
        (singular='tableone')
        (plural='tableones')
    (Table2) // multiple tables are allowed
      (test(type=DataTypes.STRING))
```
###### Transpiles to:
```javascript
const Table1 = sequelize.define('Table1', {
  Column1: {
    type: DataTypes.STRING
  },
  Column2: {
    type: DataTypes.STRING
  },
  AnotherColumn1: {
    type: DataTypes.STRING
  }
}, {
  name: {
    singular: 'tableone',
    plural: 'tableones'
  }
});
const Table2 = sequelize.define('Table2', {
  test: {
    type: DataTypes.STRING
  }
});
```
#### (...options)
The `(...options)` element is used to specify table options.  Table options specified using dot notation are set to `true`.  Table options can also be specified as an attribute of the table element.

###### Example:
```javascript
SQLZ>
  (User.timestamps.createdAt.updatedAt.deletedAt(comment='The user table'))
    (column1.unique(type=DataTypes.BOOLEAN))
      (onUpdate='CASCADE')
    (...options)
      (defaultScope)
        (where(active=true))
      (omitNull=false)
      (paranoid=false)
      (underscored=false)
      (underscoredAll=false)
      (freezeTableName=false)
      (tableName='users')
      (schema='public')
      (engine='MYISAM')
      (initialAutoIncrement='1')
```
###### Transpiles to:
```javascript
const User = sequelize.define('User', {
  column1: {
    unique: true,
    type: DataTypes.BOOLEAN,
    onUpdate: 'CASCADE'
  }
}, {
  timestamps: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  comment: 'The user table',
  defaultScope: {
    where: {
      active: true
    }
  },
  omitNull: false,
  paranoid: false,
  underscored: false,
  underscoredAll: false,
  freezeTableName: false,
  tableName: 'users',
  schema: 'public',
  engine: 'MYISAM',
  initialAutoIncrement: '1'
});
```

#### (...name)
The `(...name)` element is used to explicitly configure table names.

###### Example:
```javascript
SQLZ>
  (User)
    (name(type=DataTypes.STRING))
    (...name)
      (singular='loginuser')
      (plural='loginusers')
```
###### Transpiles to:
```javascript
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING
  }
}, {
  name: {
    singular: 'loginuser',
    plural: 'loginusers'
  }
});
```
#### (...columns)
The `(...columns)` element allows columns to be declared.  This is mainly for organization as columns can also be declared as a direct child element of a table.

###### Example:
```javascript
SQLZ>
  (User)
    (...columns)
      (name.unique(type=DataTypes.STRING(60)))
        (get=() => { return this.getDataValue('name'); })
        (set=(val) => { this.setDataValue('name', val); })
        (validate.isAlphanumeric)
          (notNull(msg='name can\'t be null'))
          (isEven=(val) => { throw new Error('Bad validation'); })
          (isNotNull=true)
```
###### Transpiles to:
```javascript
const User = sequelize.define('User', {
  name: {
    unique: true,
    type: DataTypes.STRING(60),
    function get() {
      return this.getDataValue('id');
    },
    function set(val) {
      this.setDataValue('id', val);
    },
    validate: {
      isAlphanumeric: true,
      isInt: true,
      notNull: {
        msg: 'name can\'t be null'
      },
      function isEven(val) {
        throw new Error('Bad validation');
      },
      isNotNull: true
    }
  }
});
```

#### (...getters)
The `(...getters)` element is where custom getters are declared.

###### Example:
```javascript
SQLZ>
  (User)
    (name(type=DataTypes.STRING(60)))
    (...getters)
      (getTwoName=() => { 
        return this.getDataValue('name') + " " + this.getDataValue('name'); 
      })
```
###### Transpiles to:
```javascript
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING(60)
  }
}, {
  getters: {
    function getTwoName() {
      return 
        this.getDataValue('name') + " " +
        this.getDataValue('name');
    }

  }
});
```

#### (...setters)
The `(...setters)` element is where custom setters are declared.
###### Example:
```javascript
SQLZ>
  (User)
    (name(type=DataTypes.STRING(60)))
    (...setters)
      (setFunName=(val) => { 
        this.setDataValue('name', 'Fun' + val);
      })
```
###### Transpiles to:
```javascript
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING(60)
  }
}, {
  setters: {
    function setFunName(val) {
      this.setDataValue('name', 'Fun' + val);
    }
  }
});
```

#### (...validate)
The `(...validate)` element is where custom validations are declared.
###### Example:
```javascript
SQLZ>
  (User)
    (name(type=DataTypes.STRING(60)))
    (...validate)
      (namesAreOk=() => { 
        if (this.name == "Sam")
          throw new Error("Invalid name"); 
      })
```
###### Transpiles to:
```javascript
const User = sequelize.define("User", {
  name: {
    type: DataTypes.STRING(60)
  }
}, {
  validate: {
    function namesAreOk() {
      if (this.name == "Sam")
          throw new Error("Invalid name");
    }
  }
});
```

#### (...indexes)
The `(...indexes)` element is where custom indexes are declared.
###### Example:
```javascript
SQLZ>
  (User)
    (name(type=DataTypes.STRING(60)))
    (status(type=DataType.STRING(60)))
    (...indexes)
      (user.unique(fields=['name']))
      (user_status)
        (unique=false)
        (fields=['status'])
        (where)
          (status='public')
```
###### Transpiles to:
```javascript
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING(60)
  },
  status: {
    type: DataType.STRING(60)
  }
}, {
  indexes: {
    user: {
      unique: true,
      fields: ['name']
    },
    user_status: {
      unique: false,
      fields: ['status'],
      where: {
        status: 'public'
      }
    }
  }
});
```

#### (...associations)
The `(...associations)` element is where table associations are declared.  Note that these associatations need to be initialized by calling *table.associate()* unless you use `SQLZINIT(db)`.
###### Example:
```javascript
SQLZ>
  (User)
    (name(type=DataTypes.STRING(60)))
    (...associations)
      (belongsTo.Organization)
      (belongsToMany.Project(through='UserProject'))
        (constraints=false)
```
###### Transpiles to:
```javascript
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING(60)
  }
});

User.associate = sequelize => {
  User.belongsTo(sequelize.models.Organization, {});
  User.belongsToMany(sequelize.models.Project, {
    through: 'UserProject',
    constraints: false
  });
};
```

#### (...scopes)
The `(...scopes)` element is where custom query scoping is declared.
###### Example:
```javascript
SQLZ>
  (User)
    (name(type=DataTypes.STRING(60)))
    (active(type=DataTypes.BOOLEAN))
    (...scopes)
      (activeUsers)
        (where(active=true))
```
###### Transpiles to:
```javascript
const User = sequelize.define("User", {
  name: {
    type: DataTypes.STRING(60)
  },
  active: {
    type: DataTypes.BOOLEAN
  }
}, {
  scopes: {
    activeUsers: {
      where: {
        active: true
      }
    }
  }
});
```

#### (...hooks)
The `(...hooks)` element is where custom hooks are declared.
###### Example:
```javascript
SQLZ>
  (User)
    (name(type=DataTypes.STRING(60)))
    (...hooks)
      (beforeValidate=(instance, options) => { })
      (afterValidate=(instance, options) => { })
```
###### Transpiles to:
```javascript
const User = sequelize.define("User", {
  name: {
    type: DataTypes.STRING(60)
  }
}, {
  hooks: {
    beforeValidate: (instance, options) => {},
    afterValidate: (instance, options) => {}
  }
});
```
