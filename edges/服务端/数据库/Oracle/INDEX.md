# Oracle

- [第1章 概述](#%E7%AC%AC1%E7%AB%A0-%E6%A6%82%E8%BF%B0)
- [第2章 用户和表空间](#%E7%AC%AC2%E7%AB%A0-%E7%94%A8%E6%88%B7%E5%92%8C%E8%A1%A8%E7%A9%BA%E9%97%B4)
  * [2-1 使用系统用户登录Oracle](#2-1-%E4%BD%BF%E7%94%A8%E7%B3%BB%E7%BB%9F%E7%94%A8%E6%88%B7%E7%99%BB%E5%BD%95oracle)
  * [2-2 Oracle用户和表空间之查看登录用户](#2-2-oracle%E7%94%A8%E6%88%B7%E5%92%8C%E8%A1%A8%E7%A9%BA%E9%97%B4%E4%B9%8B%E6%9F%A5%E7%9C%8B%E7%99%BB%E5%BD%95%E7%94%A8%E6%88%B7)
  * [2-3 Oracle用户和表空间之启用scott用户](#2-3-oracle%E7%94%A8%E6%88%B7%E5%92%8C%E8%A1%A8%E7%A9%BA%E9%97%B4%E4%B9%8B%E5%90%AF%E7%94%A8scott%E7%94%A8%E6%88%B7)
  * [2-4练习题](#2-4%E7%BB%83%E4%B9%A0%E9%A2%98)
  * [2-5 Oracle用户和表之间表空间概述](#2-5-oracle%E7%94%A8%E6%88%B7%E5%92%8C%E8%A1%A8%E4%B9%8B%E9%97%B4%E8%A1%A8%E7%A9%BA%E9%97%B4%E6%A6%82%E8%BF%B0)
  * [2-6 Oracle用户和表空间之查看用户表空间](#2-6-oracle%E7%94%A8%E6%88%B7%E5%92%8C%E8%A1%A8%E7%A9%BA%E9%97%B4%E4%B9%8B%E6%9F%A5%E7%9C%8B%E7%94%A8%E6%88%B7%E8%A1%A8%E7%A9%BA%E9%97%B4)
  * [2-7练习题](#2-7%E7%BB%83%E4%B9%A0%E9%A2%98)
  * [2-8 Oracle用户和表空间之创建表空间](#2-8-oracle%E7%94%A8%E6%88%B7%E5%92%8C%E8%A1%A8%E7%A9%BA%E9%97%B4%E4%B9%8B%E5%88%9B%E5%BB%BA%E8%A1%A8%E7%A9%BA%E9%97%B4)
  * [2-9 Oracle用户和表空间之修改表空间](#2-9-oracle%E7%94%A8%E6%88%B7%E5%92%8C%E8%A1%A8%E7%A9%BA%E9%97%B4%E4%B9%8B%E4%BF%AE%E6%94%B9%E8%A1%A8%E7%A9%BA%E9%97%B4)
  * [2-11练习题](#2-11%E7%BB%83%E4%B9%A0%E9%A2%98)
  * [2-12 Oracle用户和表空间之删除表空间](#2-12-oracle%E7%94%A8%E6%88%B7%E5%92%8C%E8%A1%A8%E7%A9%BA%E9%97%B4%E4%B9%8B%E5%88%A0%E9%99%A4%E8%A1%A8%E7%A9%BA%E9%97%B4)
- [第3章 管理表](#%E7%AC%AC3%E7%AB%A0-%E7%AE%A1%E7%90%86%E8%A1%A8)
  * [3-1 Oracle管理表之认识表](#3-1-oracle%E7%AE%A1%E7%90%86%E8%A1%A8%E4%B9%8B%E8%AE%A4%E8%AF%86%E8%A1%A8)
  * [3-2 Oracle管理表之数据类型](#3-2-oracle%E7%AE%A1%E7%90%86%E8%A1%A8%E4%B9%8B%E6%95%B0%E6%8D%AE%E7%B1%BB%E5%9E%8B)
  * [3-3练习题](#3-3%E7%BB%83%E4%B9%A0%E9%A2%98)
  * [3-4 Oracle管理表](#3-4-oracle%E7%AE%A1%E7%90%86%E8%A1%A8)
  * [3-5 Oracle管理表之修改表](#3-5-oracle%E7%AE%A1%E7%90%86%E8%A1%A8%E4%B9%8B%E4%BF%AE%E6%94%B9%E8%A1%A8)
  * [3-6练习题](#3-6%E7%BB%83%E4%B9%A0%E9%A2%98)
  * [3-7 Oracle管理表之删除表](#3-7-oracle%E7%AE%A1%E7%90%86%E8%A1%A8%E4%B9%8B%E5%88%A0%E9%99%A4%E8%A1%A8)
- [第4章 表中数据](#%E7%AC%AC4%E7%AB%A0-%E8%A1%A8%E4%B8%AD%E6%95%B0%E6%8D%AE)
  * [4-1 Oracle操作表中的数据](#4-1-oracle%E6%93%8D%E4%BD%9C%E8%A1%A8%E4%B8%AD%E7%9A%84%E6%95%B0%E6%8D%AE)
  * [4-2 Oracle复制表数据](#4-2-oracle%E5%A4%8D%E5%88%B6%E8%A1%A8%E6%95%B0%E6%8D%AE)
  * [4-3 Oracle修改数据](#4-3-oracle%E4%BF%AE%E6%94%B9%E6%95%B0%E6%8D%AE)
  * [4-4 Oracle删除数据](#4-4-oracle%E5%88%A0%E9%99%A4%E6%95%B0%E6%8D%AE)
- [第5章 约束](#%E7%AC%AC5%E7%AB%A0-%E7%BA%A6%E6%9D%9F)
  * [5-1 Oracle约束概述](#5-1-oracle%E7%BA%A6%E6%9D%9F%E6%A6%82%E8%BF%B0)
  * [5-2 Oracle非空约束](#5-2-oracle%E9%9D%9E%E7%A9%BA%E7%BA%A6%E6%9D%9F)
  * [5-3 Oracle主键约束](#5-3-oracle%E4%B8%BB%E9%94%AE%E7%BA%A6%E6%9D%9F)
  * [5-4 Oracle在修改表时添加主键约束](#5-4-oracle%E5%9C%A8%E4%BF%AE%E6%94%B9%E8%A1%A8%E6%97%B6%E6%B7%BB%E5%8A%A0%E4%B8%BB%E9%94%AE%E7%BA%A6%E6%9D%9F)
  * [5-5 Oracle在创建表时添加外键约束（上）](#5-5-oracle%E5%9C%A8%E5%88%9B%E5%BB%BA%E8%A1%A8%E6%97%B6%E6%B7%BB%E5%8A%A0%E5%A4%96%E9%94%AE%E7%BA%A6%E6%9D%9F%E4%B8%8A)
  * [5-6 Oracle在创建表时设置外键约束（下）](#5-6-oracle%E5%9C%A8%E5%88%9B%E5%BB%BA%E8%A1%A8%E6%97%B6%E8%AE%BE%E7%BD%AE%E5%A4%96%E9%94%AE%E7%BA%A6%E6%9D%9F%E4%B8%8B)
  * [5-7 Oracle在修改表时添加外键约束](#5-7-oracle%E5%9C%A8%E4%BF%AE%E6%94%B9%E8%A1%A8%E6%97%B6%E6%B7%BB%E5%8A%A0%E5%A4%96%E9%94%AE%E7%BA%A6%E6%9D%9F)
  * [5-8 Oracle删除约束](#5-8-oracle%E5%88%A0%E9%99%A4%E7%BA%A6%E6%9D%9F)
  * [5-9 Oracle在创建表时设置唯一约束](#5-9-oracle%E5%9C%A8%E5%88%9B%E5%BB%BA%E8%A1%A8%E6%97%B6%E8%AE%BE%E7%BD%AE%E5%94%AF%E4%B8%80%E7%BA%A6%E6%9D%9F)
  * [5-10 Oracle在修改表时添加唯一约束](#5-10-oracle%E5%9C%A8%E4%BF%AE%E6%94%B9%E8%A1%A8%E6%97%B6%E6%B7%BB%E5%8A%A0%E5%94%AF%E4%B8%80%E7%BA%A6%E6%9D%9F)
  * [5-11 Oracle删除唯一约束](#5-11-oracle%E5%88%A0%E9%99%A4%E5%94%AF%E4%B8%80%E7%BA%A6%E6%9D%9F)
  * [5-12 Oracle在创建表时设置检查约束](#5-12-oracle%E5%9C%A8%E5%88%9B%E5%BB%BA%E8%A1%A8%E6%97%B6%E8%AE%BE%E7%BD%AE%E6%A3%80%E6%9F%A5%E7%BA%A6%E6%9D%9F)
  * [5-13 Oracle在修改表时添加检查约束](#5-13-oracle%E5%9C%A8%E4%BF%AE%E6%94%B9%E8%A1%A8%E6%97%B6%E6%B7%BB%E5%8A%A0%E6%A3%80%E6%9F%A5%E7%BA%A6%E6%9D%9F)
  * [5-14 Oracle删除检查约束](#5-14-oracle%E5%88%A0%E9%99%A4%E6%A3%80%E6%9F%A5%E7%BA%A6%E6%9D%9F)
  * [5-15约束小结](#5-15%E7%BA%A6%E6%9D%9F%E5%B0%8F%E7%BB%93)
  * [5-16练习题](#5-16%E7%BB%83%E4%B9%A0%E9%A2%98)
  * [5-17练习题](#5-17%E7%BB%83%E4%B9%A0%E9%A2%98)
  * [5-18练习题](#5-18%E7%BB%83%E4%B9%A0%E9%A2%98)
- [第6章 插叙语句](#%E7%AC%AC6%E7%AB%A0-%E6%8F%92%E5%8F%99%E8%AF%AD%E5%8F%A5)
  * [6-1 Oracle查询概述](#6-1-oracle%E6%9F%A5%E8%AF%A2%E6%A6%82%E8%BF%B0)
  * [6-2 Oracle基本查询语句](#6-2-oracle%E5%9F%BA%E6%9C%AC%E6%9F%A5%E8%AF%A2%E8%AF%AD%E5%8F%A5)
  * [6-3 Oracle查询语句之在sql/plus中设置格式](#6-3-oracle%E6%9F%A5%E8%AF%A2%E8%AF%AD%E5%8F%A5%E4%B9%8B%E5%9C%A8sqlplus%E4%B8%AD%E8%AE%BE%E7%BD%AE%E6%A0%BC%E5%BC%8F)
  * [6-4 Oracle查询语句之查询表中的所有字段及指定字段](#6-4-oracle%E6%9F%A5%E8%AF%A2%E8%AF%AD%E5%8F%A5%E4%B9%8B%E6%9F%A5%E8%AF%A2%E8%A1%A8%E4%B8%AD%E7%9A%84%E6%89%80%E6%9C%89%E5%AD%97%E6%AE%B5%E5%8F%8A%E6%8C%87%E5%AE%9A%E5%AD%97%E6%AE%B5)
  * [6-5 Oracle查询语句之给字段设置别名](#6-5-oracle%E6%9F%A5%E8%AF%A2%E8%AF%AD%E5%8F%A5%E4%B9%8B%E7%BB%99%E5%AD%97%E6%AE%B5%E8%AE%BE%E7%BD%AE%E5%88%AB%E5%90%8D)
  * [6-6 Oracle运算符和表达式](#6-6-oracle%E8%BF%90%E7%AE%97%E7%AC%A6%E5%92%8C%E8%A1%A8%E8%BE%BE%E5%BC%8F)
  * [6-7 Oracle在select语句中使用运算符](#6-7-oracle%E5%9C%A8select%E8%AF%AD%E5%8F%A5%E4%B8%AD%E4%BD%BF%E7%94%A8%E8%BF%90%E7%AE%97%E7%AC%A6)
  * [6-8 Oracle带条件的查询](#6-8-oracle%E5%B8%A6%E6%9D%A1%E4%BB%B6%E7%9A%84%E6%9F%A5%E8%AF%A2)
  * [6-9 Oracle模糊查询](#6-9-oracle%E6%A8%A1%E7%B3%8A%E6%9F%A5%E8%AF%A2)
  * [6-10 Oracle范围查询](#6-10-oracle%E8%8C%83%E5%9B%B4%E6%9F%A5%E8%AF%A2)
  * [6-11 Oracle 对查询结果进行排序](#6-11-oracle-%E5%AF%B9%E6%9F%A5%E8%AF%A2%E7%BB%93%E6%9E%9C%E8%BF%9B%E8%A1%8C%E6%8E%92%E5%BA%8F)
  * [6-12 case...when语句](#6-12-casewhen%E8%AF%AD%E5%8F%A5)
  * [6-13 练习题](#6-13-%E7%BB%83%E4%B9%A0%E9%A2%98)
  * [6-14 练习题](#6-14-%E7%BB%83%E4%B9%A0%E9%A2%98)
  * [6-15 decode函数的使用](#6-15-decode%E5%87%BD%E6%95%B0%E7%9A%84%E4%BD%BF%E7%94%A8)

---



学自慕课网 

## 第1章 概述


## 第2章 用户和表空间
### 2-1 使用系统用户登录Oracle
·sys, system sys必须以管理员或系统操作人员的权限登录, system可以直接登录

·sysman 操作企业管理器时使用，也是管理员级别的用户

·scott 示例用户，默认密码是tiger

·其他用户

管理员用户 和sys想比区别在于system不能创建表空间



登录命令

·[username/password] [@server] [as sysdba|sysoper]

或直接输入username根据提示完成其他步骤



·connect/conn + 登录命令切换用户

切换到sys时要加as sysdba或as sysoper





### 2-2 Oracle用户和表空间之查看登录用户
·show user命令 查看登录到SQL Plus里的用户是哪一个

·dba_users 数据字典 数据字典是数据库提供的表，用于查看数据库的信息。

·desc/describe dba_users 查询数据字典 （scott不可用，sys可用）

·select username from dba_users; 从数据字典中查找所有的用户，SQL语句，要加分号

·dba_开头的是查全库所有的，all_开头的是查当前用户可以看到的，user_开头的是查当前用户的





### 2-3 Oracle用户和表空间之启用scott用户
·启用用户的语句

alter user [username] account unlock;/alter user [username] account lock;  SQL语句





### 2-4练习题




### 2-5 Oracle用户和表之间表空间概述
表空间的分类

·永久表空间   //数据库中要永久存储的一些对象，如：表、视图、存储过程

·临时表空间   //存放数据库操作过程中中间执行的过程，执行结束后存放的内容就会被自动释放

·UNDO表空间   //用于保存事物所修改属性的旧值





### 2-6 Oracle用户和表空间之查看用户表空间
·dba_tablespaces、user_tablespaces 数据字典 第一个数据字典针对的是系统管理员自己的用户，第二个是普通用户登陆后查看的字典   管理员也可以查看普通用户的字典

Desc dba_tablespaces

Select tablespace_name from tablespaces;



系统管理员登录时对应的默认的表空间有以上六个

System 主要是用于存放sys的表视图以及存储过程的数据库对象，也被称为是系统表空间

Sysaux 作为example的辅助表空间

Example 用于安装oracle 11g数据库实例的表空间

Undotbs1 存储撤销信息，属于undo类型的表空间

Temp 用于存储SQL语句处理的表和索引信息，是临时表空间



·users 是永久表空间，用于存储用户创建的数据库对象，类似于system，只不过system用来存放系统信息





设置用户的默认或临时表空间

·ALTER USER username

  DEFAULT|TEMPORARY TABLESPACE

  tablespace_name

普通用户没有修改默认表空间的权限。可使用管理员用户来修改普通用户的默认表空间



### 2-7练习题




### 2-8 Oracle用户和表空间之创建表空间
创建表空间

·CREATE [TEMPORARY] TABLESPACE

  tablespace_name

  TEMPFILE|DATAFILE ‘xx.dbf’ SIZE xx

  默认存放在oracle的安装目录下







desc dba_data_files/dba_temp_files







### 2-9 Oracle用户和表空间之修改表空间
·修改表空间的状态

	·设置联机或脱机状态

		ALTER TABLESPACE tablespace_name

		ONLINE|OFFLINE

		可通过查询dba_tablespaces中的status的方式来查看

	·设置只读或可读写状态

		ALTER TABLESPACE tablespace_name

		READ ONLY|READ WRITE

·修改数据文件



2-10 Oracle用户和表空间之修改数据文件

·增加数据文件

	·ALTER TABLESPACE tablespace_name

	ADD DATAFILE 'xx.dbf' SIZE xx;

·删除数据文件

	·ALTER TABLESPACE tablespace_name

	DROP DATAFILE 'filename.dbf'

	不能删除创建表空间时的第一个数据文件。如果要删除，需要把整个表空间都删掉



### 2-11练习题




### 2-12 Oracle用户和表空间之删除表空间
删除表空间

·DROP TABLESPACE

tablespace_name [INCLUDING CONTENTS]

不加INCLUDING CONTENTS 仅删除表空间，数据文件保留



## 第3章 管理表
### 3-1 Oracle管理表之认识表
·认识表

	·是基本存储单位

	·二维结构

	·行（记录）和列（域或字段）

	·约定

		·每一列数据必须具有相同数据类型

		·列名唯一

		·每一行数据的唯一性

·数据类型

·管理表

### 3-2 Oracle管理表之数据类型
·字符型

	·CHAR(n)、NCHAR(n)

		不可变长度类型，如未填满会补充空格

		NCHAR(n)按unicode存放数据,一般用来存放汉字

		CHAR(n) MAX:2000  NCHAR(n) MAX:1000

	·VARCHAR2(n)、NVARCHAR2(n) 可变长度类型

		NVARCHAR(n)按unicode存放数据,一般用来存放汉字

		VARCHAR(n) MAX:4000  NVARCHAR(n) MAX:2000

·数值型

	·NUMBER、NUMBER(p)、NUMBER(p,s)

		p->有效数字,s->小数点后位数。s可为负

		p:1~38	s:-84~127  或*

		四舍五入

		1234.9876  NUMBER(6)=NUMBER(6,0)  1235

		NUMBER(5,2) 有效数字5位，保留2位小数，如123.45

	·FLOAT(n) 存放二进制数据 1~126位

		FLOAT(b) specifies a floating-point number with binary precision b. The precision b can range from 1 to 		126. To convert from binary to decimal precision, multiply b by 0.30103。

·日期型

	·DATE

		精确到秒

		DATE类型表示范围:

		公元前4712年1月1日到公元9999年12月31日

	·TIMESTAMP

		精确到小数秒

·其他类型

	·BLOB

		可以以二进制的形式存放4g的数据

	·CLOB

		可以以字符串的形式存放4g的数据



### 3-3练习题




### 3-4 Oracle管理表
·创建表

	·基本语法

		CREATE TABLE table_name

		(

			column_name datatype, ...

		)；

		同一个用户下表名唯一，多个列之间用逗号隔开

	·练习：创建用户信息表

		·所需字段

			编号、用户名、密码、邮箱、注册时间

		·字段的类型





·修改表

·删除表



### 3-5 Oracle管理表之修改表
·添加字段

	ALTER TABLE table_name

	ADD column_name datatype;

·更改字段数据类型

	ALTER TABLE table_name

	MODIFY column_name datatype;

	·当字段没有数据或者要修改的新类型和原类型兼容时，可以直接modify修改。

	·当字段有数据并用要修改的新类型和原类型不兼容时，要间接新建字段来转移。

·删除字段

	ALTER TABLE table_name

	DROP COLUMN column_name;

·修改字段名

	ALTER TABLE table_name

	RENAME COLUMN column_name TO

	new_column_name

·修改表名

	RENAME table_name TO new_table_name;



### 3-6练习题




### 3-7 Oracle管理表之删除表
·TRUNCATE TABLE table_name

	是删除表当中的全部数据，并不是将表删除掉，用desc可以看到表存在，也叫做截断	表。执行速度比delete快很多。

	DDL效率高于DML

·DROP TABLE table_name

	删除整张表



## 第4章 表中数据
### 4-1 Oracle操作表中的数据
操作后要输入commit; 提交保存

·添加数据

	·INSERT语句

		INSERT INTO table_name

		(column1, column2, ...)	//如果为所有字段添加value则此句可以省略

		VALUES(value1, value2, ...);

	·操作实例

		sysdate：获取当前系统时间

		·向表中所有字段添加值



		·向表中指定字段添加值

		·向表中添加默认值

			在数据类型后加DEFAULT value



	·复制表数据

·修改数据

·删除数据



### 4-2 Oracle复制表数据
·在建表时复制

	CREATE TABLE table_new

	AS

	SELECT column1, ...|* FROM table_old

·在添加时复制

	·INSERT INTO table_new

	[(column1, ...)]

	SELECT column1, ...|* FROM table_old



### 4-3 Oracle修改数据
·UPDATE语句

	·UPDATE table_name

	SET column1=value1,...

	[WHERE conditions]

·操作实例



### 4-4 Oracle删除数据
·DELETE语句

	·DELETE FROM table_name

	[WHERE conditions]

·操作实例



## 第5章 约束
### 5-1 Oracle约束概述
不同表的约束的名字不可以相同

·约束的作用

	·定义规则

	·确保完整性

·非空约束

·主键约束

·外键约束

·唯一约束

·检查约束



### 5-2 Oracle非空约束
·在创建表时设置非空约束

	（默认允许为空）

	CREATE TABLE table_name(

	column_name datatype NOT NULL,...

	);

·在修改表时添加非空约束

	ALTER TABLE table_name

	MODIFY column_name [datatype] NOT NULL;

·在修改表时去除非空约束

	ALTER TABLE table_name

	MODIFY column_name datatype NULL;



### 5-3 Oracle主键约束
作用：确保表当中每一行数据的唯一性 非空，唯一

一张表只能设计一个主键约束

主键约束可以由多个字段构成（联合主键或复合主键）

·在创建表时设置主键约束

	·CREATE TABLE table_name(

		column_name datatype PRIMARY KEY, ...

	)



	·CONSTRAINT constraint_name

	PRIMARY KEY(column_name1, ...)



查询关键字名：







### 5-4 Oracle在修改表时添加主键约束
·在修改表时添加主键约束

	ALTER TABLE table_name

	ADD CONSTRAINT constraint_name

	PRIMARY KEY(column_name1, ...);

·更改约束的名称

	ALTER TABLE table_name

	RENAME CONSTRAINT old_name

	TO new_name

·删除主键约束

	ALTER TABLE table_name

		·DISABLE|ENABLE CONSTRAINT constraint_name

		只是禁用，并未删除

		通过查询dba_constraints中表的status查询关键字状态

	·DROP CONSTRAINT constraint_name

	·DROP PRIMARY KEY[CASCADE]级联删除，比如你删除某个表的时候后面加这个关键字

会在删除这个表的同时删除和该表有关系的其他对象





### 5-5 Oracle在创建表时添加外键约束（上）
CREATE TABLE table1

(column_name1 datatype REFERENCES

table2(column_name2), ...);

主从表

table1为主表，table2为从表

·column_name1与column_name2不必相同

·设置外键约束时，主表的字段必须是主键

·主从表中相应的字段必须是同一个数据类型

·从表中外键字段的值必须来自主表中的相应自断你的值，或者为null值



### 5-6 Oracle在创建表时设置外键约束（下）
CONSTRAINT constraint_name

FOREIGN KEY(column_name) REFERENCES

table_name(column_name) [ON DELETE CASCADE]

启用级联删除时，当主表删除一条记录的时候，从表中引用相同值的地方也会发生变化



### 5-7 Oracle在修改表时添加外键约束
·ADD CONSTRAINT constraint_name

FOREIGN KEY(column_name) REFERENCES

table_name(column_name) [ON DELETE CASCADE]

·MODIFY column_name REFERENCES table_name(column_name) [ON DELETE CASCADE]



### 5-8 Oracle删除约束
·DISABLE|ENABLE CONSTRAINT constraint_name

	禁用/启用

·DROP CONSTRAINT constraint_name



### 5-9 Oracle在创建表时设置唯一约束
·作用：保证字段值得唯一性

·唯一约束和主键约束的区别：

	主键字段值必须是非空的，在每张表中只能有一个

	唯一约束允许有一个空值，在每张表中可以有有多个

·在创建表时设置唯一约束

	·CREATE TABLE table_name

	(column_name datatype UNIQUE, ...)

	·CONSTRAINT constraint_name

	UNIQUE(column_name)

唯一约束一般以un开头



### 5-10 Oracle在修改表时添加唯一约束
·ADD CONSTRAINT constraint_name

UNIQUE(column_name);

·MODIFY column_name UNIQUE;



### 5-11 Oracle删除唯一约束
·DISABLE|ENABLE CONSTRAINT constraint_name

·DROP CONSTRAINT constraint_name



### 5-12 Oracle在创建表时设置检查约束
·CREATE TABLE table_name

(column_name datatype CHECK(expressions), ...);

·CONSTRAINT constraint_name CHECK(expressions)

check中用and连接不同列的检查约束

以ck或chk开头



### 5-13 Oracle在修改表时添加检查约束
·ADD CONSTRAINT constraint_name

CHECK(expressions);

·MODIFY column_name CHECK(expressions);



### 5-14 Oracle删除检查约束
·DISABLE|ENABLE CONSTRAINT constraint_name

·DROP CONSTRAINT constraint_name



### 5-15约束小结
·总结

	·非空约束

		每张表只能有一个，可以由多个字段构成

	·主键约束

		涉及两个表之间的关系

	·外键约束

	·唯一约束

	·检查约束

	·在创建表时设置约束

		非空约束只能在列级设置，不能在表级设置

	·在修改表时添加约束

		ALTER TABLE table_name

		MODIFY column_name datatype NOT NULL;

·更改约束的名称

	·数据字典（user_constraints）

	·RENAME CONSTRAINT old_name

	TO new_name

·删除约束

	ALTER TABLE table_name

	·MODIFY column_name datatype NULL;

	·DROP PRIMARY KEY 主键只有一个，所以可以选择直接删除

	·DISABLE|ENABLE CONSTRAINT constraint_name

	·DROP CONSTRAINT constraint_name





### 5-16练习题




### 5-17练习题




### 5-18练习题


此题错误，可以有多个空值！！！

设置外键约束时，主表的字段必须是主键，因此不能为空值。从表中外键字段的值必须来自主表中的相应字段的值，或者为空值，空值可以有多个。因此外键约束不符合题目要求。



## 第6章 插叙语句
### 6-1 Oracle查询概述
·基本查询语句

·在SQL*PLUS中设置格式（对查询结果的格式设置）

·查询表中的所有字段及指定字段

·给字段设置别名（针对查询结果）

·运算符和表达式

·带条件的查询

·模糊查询

·范围查询

·对查询结果排序

·case...when语句的使用

·decode函数的使用



### 6-2 Oracle基本查询语句
·SELECT [DISTINCT] column_name1, ...|*

FROM table_name1,tablename2...

[WHERE conditions]



### 6-3 Oracle查询语句之在sql/plus中设置格式
不用加分号

·COLUMN/COL column_name HEADING new_name

一次只能给一个字段设置别名





·COLUMN column_name FORMAT dataformat

字符类型只能设置显示的长度







·COLUMN column_name CLEAR

清除列的格式



### 6-4 Oracle查询语句之查询表中的所有字段及指定字段
·查询所有字段

SELECT * FROM table_name



### 6-5 Oracle查询语句之给字段设置别名
可一次为多个字段设置别名

SELECT column_name [AS] new_name, ...

FROM table_name

AS可以省略，用空格隔开原来的字段名和新字段名即可



### 6-6 Oracle运算符和表达式
表达式=操作数+运算符

Oracle中的操作数可以有变量、常量和字段

·算数运算符(+, -, *, / )

·比较运算符(> ,>=, <, <=, =, <> )

·逻辑运算符(and, or, not)





### 6-7 Oracle在select语句中使用运算符
·使用算术运算符

·使用比较运算符

·使用逻辑运算符

两边返回值类型都必须是布尔类型



### 6-8 Oracle带条件的查询
·单一条件的查询



### 6-9 Oracle模糊查询
·关键字：LIKE

·通配符的使用(_, % )

一个_只能代表一个字符，%可以代表0到多个任意字符



### 6-10 Oracle范围查询
·BETWEEN ... AND ...

在...与...之间 查询结果为闭区间

·IN/NOT IN

后面跟的不是范围而是具体的值



### 6-11 Oracle 对查询结果进行排序
·SELECT ... FROM ... [WHERE ...]

ORDER BY coumn1 DESC/ASC



### 6-12 case...when语句
·CASE column_name

WHEN value1 THEN result1 WHEN value2 THEN result2...

[ELSE result] END

都不满足时返回空值



·CASE

WHEN column_name=value1

THEN result, ...[ELSE result] END

这种形式下when后可接任意表达式如: column_name<value

都不满足时返回空值





### 6-13 练习题




### 6-14 练习题




### 6-15 decode函数的使用
·DECODE(column_name, value1, result1, value2, result2 ..., defaultvalue)

都不满足时返回空值



> 更新: 2025-07-19 12:55:42  
> 原文: <https://www.yuque.com/viruspc/el3mi0/cdh7ac0umc7c56r8>