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
