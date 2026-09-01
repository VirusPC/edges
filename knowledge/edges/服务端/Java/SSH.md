# SSH

一.Hibernate框架

1.Hibernate核心配置文件（hibernate.cfg.xml）

    ·数据库信息

    ·hibernate信息

    ·映射配置

    ·如果单纯使用hibernate框架，核心配置文件名称hibernate.cfg.xml和位置src是固定的。

     hibernate和spring整合的时候，hibernate核心配置文件名称和位置是没有固定要求的。



2.Hibernate配置映射文件(*.hbm.xml)

    ·实体类和数据库表映射关系——使用orm思想



3.hibernate操作的步骤

    ·在spring框架对hibernate框架进行封装，使用HibernateTemplate

    ·HibernateTemplate常用API

        ·Serializable save(Object entity)

        ·void update(Object entity)

        ·void delete(Object entity)

        ·<T> T get(Class<T> entityClass, Serializable id)

        ·<T> T load(Class<T> entityClass, Serializable id)

        ·List find(String query String, Object... values)





二.Struts2框架

1.Action操作

    ·action创建三种方式

        ·普通类

        ·实现Action接口

        ·继承ActionSupport（常用）

    ·配置action访问路径

        ·创建struts.xml配置文件，这个文件名称和位置固定在src下面

    ·配置访问action的多个方法

        ·使用通配符

    ·在action获取表单提交数据

        ·获取request对象（功能最强大）

            ·使用ServletActionContext类获取

        ·属性封装

        ·模型驱动（重点，最常用）

        ·表达式封装

        ·属性封装和模型驱动不能同时对同一个表单进行操作，优先使用模型驱动

    ·在action操作域对象

        ·使员工ServletActionContext获取域对象

    ·过滤器

        ·StrutsPrepareAndExecuteFilter

2.值栈

    ·向值栈放数据

        ·set方法

        ·push方法

        ·定义变量生成get方法

    ·从值栈获取数据

        ·在jsp中使用struts2标签+ognl获取

            ·<s:property>

            ·<s:iterator>



3.拦截器

    ·aop和责任链某事

    ·自定义拦截器

        ·继承自MethodFilterInterceptor

        ·重写类里面的方法

        ·配置拦截器和action关联





三.spring框架

1.spring核心配置文件

    ·名称和位置没有固定要求

    ·在spring核心配置文件中引入schema约束



2.创建对象

    ·xml配置方式<bean id="" class="" scope="">

    ·注解方式：四个注解

        ·@Component

        ·@Service

        ·@Controller

        ·@Repository



3.注入属性（对象类型属性）

    ·xml配置方式

    ·注解方式：两个注解

        ·@Autowired

        ·@Resource



4.使用ServletContext对象和监听器实现

    ·在服务器启动的时候，加载spring配置文件，创建对象

    ·配置spring的监听器

    ·指定spring配置文件位置



5.jdbcTemplate



6.spring事务配置

    ·xml

    ·注解



四.struts2框架和spring框架整合

1.把struts2的action对象创建交给spring进行管理



2.实现过程

    ·第一步 导入struts2的jar包和用于整合的jar包 struts2-spring-plugin.jar

    ·第二步 创建bean

        ·多实例

        ·<bean id="userAction" class="cn.itcast.action.UserAction"

         scope="prototype"></bean>

    ·第二步 创建action

        ·class里面不再写action的全路径，而是spring中配置的id，否则action对象会被创建

         两次。

        ·<action name="userAction" class="userAction"></action>







五.hibernate框架和spring框架整合

1.把hibernate核心配置文件里面的数据库配置，直接写在spring配置文件中



2.第一次访问很慢，因为第一次访问的时候创建sessionFactory对象

        ·把sessionFactory对象创建交给spring管理，在服务器启动时加载



3.实现过程

    ·第一步 导入hibernate的jar包和用于整合的jar包 spring-orm.jar

    ·第二步 搭建hibernate环境

        ·创建实体类

        ·配置实体类映射关系 xxx.hbm.xml

        ·创建核心配置文件，不写数据库信息

    ·第三步 把hibernate核心配置文件数据库配置，在spring进行配置（c3p0连接池）

     <bean id="dataSource" class="com.mchange.v2.c3p0.ComboPooledDataSource">

        <property name="driverClass" value="com.mysql.jdbc.Driver"></property>

        <property name="jdbcUrl" value="jdbc:mysql:///spring_day4?useSSL=false">

            </property>

        <property name="user" value="root"></property>

        <property name="password" value="54pengcheng"></property>

     </bean>

    ·第四步 把hibernate的SessionFactory交给spring配置

        ·服务器启动时候，加载spring配置文件，创建配置文件中的对象

        ·在spring中配置sessionFactory对象

        ·因为创建sessionFactory代码不是new出来的，而是多行代码实现的

        ·

         <!-- sessionFactory创建交给spring管理 -->

             <bean id="sessonFactory" class=

                "org.springframework.orm.hibernate5.LocalSessionFactoryBean">

             <!-- 指定数据库信息 -->

             <property name="dataSource" ref="dataSource"></property>

             <!-- 指定使用hibernate核心配置文件位置 -->

             <property name="configLocations" value=

                "classpath:hibernate.cfg.xml"></property>

         </bean>

    ·第五步 在dao里面得到hibernateTemplate的对象

     Hibernate5.0 org.springframework.orm.hibernate5.HibernateTemplate

        ·在dao得到HibernateTemplate的对象

         <!-- 创建实现类对象 -->

         <bean id="userDaoImpl" class="cn.itcast.dao.UserDaoImpl">

             <property name="hibernateTemplate" ref="hibernateTemplate">

             </property>

         </bean>

         <!-- 创建hibernateTemplate对象 -->

         <bean id="hibernateTemplate" class=

            "org.springframework.orm.hibernate5.HibernateTemplate">

             <!-- 注入sessionFactory -->

             <property name="sessionFactory" ref="sessionFactory"></property>

         </bean>

    ·第六步 配置事务

        ·<!-- 第一步 配置事务管理器 -->

         <bean id="transactionManager" class=

            "org.springframework.orm.hibernate5.HibernateTransactionManager">

             <!-- 注入sessionFactory -->

             <property name="sessionFactory" ref="sessionFactory"></property>

         </bean>

         <!-- 第二步 开启事务注解 -->

         <tx:annotation-driven transaction-manager="transactionManager"/>

        ·需要注释掉hibernate.cfg.xml中的 <property name=

         "hibernate.current_session_context_class">thread</property>





六.HibernateTemplateTemplate介绍

1.HibernateTemplate对hibernate框架进行封装，直接调用HibernateTemplate里面的方法实现

  功能



2.hibernateTemplate常用API

    ·Serializable save(Object enetity); 添加操作

    ·void update(Object entity); 修改操作

    ·void delete(Object entity); 删除操作

    ·<T> T get(Class<T> entityClas, Serializable id); 根据id查询

    ·<T> T load(Clsss<T> entityClass, Serializable id); 根据id查询

    ·List find(String queryString, Object... values); 查询操作的方法

        ·第一个参数是hql语句

        ·第二个参数是语句参数值



七.SSH框架整合过程

1.导入基本jar包



2.搭建struts2开发环境

    ·配置action，创建struts.xml配置文件，配置action

    ·配置struts2配置struts2的过滤器



3.第三步 搭建hibernate开发环境

    ·创建实体类

    ·配置实体咧和数据库表映射关系

    ·创建hibernate核心配置文件

        ·引入映射配置文件



4.搭建spring环境

    ·创建spring核心配置文件

    ·让spring配置文件在服务器启动时候加载

        ·配置监听器

        ·指定spring配置文件位置



5.struts2和spring整合

    ·把action在spring配置（action为多实例）

    ·在struts.xml中action标签class属性里面写bean的id值



6.spring和hibernate整合

    ·把hibernate核心配置文件中数据库配置，在spring里面配置

    ·把hibernate的sessionFactory在spring里面配置



7.在到里面使用hibernateTemplate

    ·在dao注入hibernateTemplate对象

    ·在hibernateTemplate对象中注入sessionFactory



8.配置事务





八.其他整合方式

·把hibernate.cfg.xml在spring中进行配置

    //要把hbm2ddl.auto改成hibernate.hbm2ddl.auto

    <property name="hibernateProperties">

        <props >

            <prop key="show_sql">true</prop>

            <prop key="format_sql">true</prop>

            <prop key="hibernate.hbm2ddl.auto">update</prop>

            <prop key="dialect">org.hibernate.dialect.MySQL5InnoDBDialect</prop>

        </props>

    </property>

·把映射文件引入配置

    <property name="mappingResources">

        <list>

            <value>cn/itcast/entity/User.hbm.xml</value>

        </list>

    </property>



九.spring分模块开发

1.在spring里面配置多个内容，造成配置混乱，不利于维护



2.把spring核心配置文件中，一部分配置放到单独的配置文件中，在spring核心配置文件中引入单

 独配置文件



3.<import resource="classpath:user.xml"/>



> 更新: 2025-07-19 13:05:20  
> 原文: <https://www.yuque.com/viruspc/el3mi0/tbf41nwsr1q2boyy>