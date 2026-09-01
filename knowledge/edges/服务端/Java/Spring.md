# Spring

<?xml version="1.0" encoding="UTF-8"?>

<beans xmlns="[http://www.springframework.org/schema/beans"](http://www.springframework.org/schema/beans")

    xmlns:xsi="[http://www.w3.org/2001/XMLSchema-instance"](http://www.w3.org/2001/XMLSchema-instance")

    xmlns:aop="[http://www.springframework.org/schema/aop"](http://www.springframework.org/schema/aop")

    xmlns:context="[http://www.springframework.org/schema/context"](http://www.springframework.org/schema/context")

    xmlns:tx="[http://www.springframework.org/schema/tx"](http://www.springframework.org/schema/tx")

    xsi:schemaLocation="[http://www.springframework.org/schema/beans](http://www.springframework.org/schema/beans)

    [http://www.springframework.org/schema/beans/spring-beans-3.0.xsd](http://www.springframework.org/schema/beans/spring-beans-3.0.xsd)

    [http://www.springframework.org/schema/aop](http://www.springframework.org/schema/aop)

    [http://www.springframework.org/schema/aop/spring-aop.xsd](http://www.springframework.org/schema/aop/spring-aop.xsd)

    [http://www.springframework.org/schema/context](http://www.springframework.org/schema/context)

    [http://www.springframework.org/schema/context/spring-context-3.0.xsd](http://www.springframework.org/schema/context/spring-context-3.0.xsd)

    [http://www.springframework.org/schema/tx](http://www.springframework.org/schema/tx)

    [http://www.springframework.org/schema/tx/spring-tx.xsd](http://www.springframework.org/schema/tx/spring-tx.xsd)

    ">

</beans>





一、Spring入门

1.Spring概念

    ·spring是开源的轻量级框架

    ·spring核心主要两部分：

        ·aop（aspect-oriented programming）：面向切面编程，扩展功能不是修改源代码实现

        ·ioc(inversion of control)：控制反转。

         比如有一个类，在类里面有方法（不是静态的方法），调用类里面的方法，创建类的对象，使用对

         象调用方法，创建类对象的过程

         对象的创建不是通过new方式实现，而是交给spring配置创建类对象

    ·spring是一站式框架

        ·spring在javaee三层结构中，每一层都提供不同的解决技术

            ·web层：springMVC

            ·service层：spring的ioc

            ·dao层：spring的jdbc Template

    ·spring版本

            ·hibernate 5.x

            ·spring 4.x



2.Spring的ioc操作

    ·把对象的创建交给spring进行管理

    ·ioc操作两部分

            ·ioc的配置文件方式

            ·ioc的注解方式



3.IOC底层原理

    ·ioc底层原理使用技术

        ·xml配置文件

        ·dom4j解决xml

        ·工厂设计模式

        ·反射

    ·代码示例

        ·原始代码：

         public class User{

            public void add(){

                ...

            }

         }

         //调用类里面的方法

         User user = new User();

         user.add();

         缺陷：耦合度太高

        ·使用工厂模式解耦合操作

         public class UserService{

            public void add(){

                ...

            }

         }

         //解决方案，创建工厂类

         public class Factory{

            //提供返回UserService对象的方法

            public static UserService getService(){

                return new UserService();

            }

         }

         public class UserServlet{

            UserService s = Factory.getService();

            s.add();

         }

    ·dom4j实现

        ·A，创建xml配置文件，配置要创建对象类

         <bean id="userService" class="cn.itcast.UserService"/>

        ·B，创建静态工厂类，使用dom4j解析配置文件+反射

         public class UserFactory{

            //返回UserService对象的方法

            public static UserService getService() {

                //1.使用dom4j解析xml文件

                //根据id值 userService，得到id值对应class属性值

                String classValue= "class属性值";

                //2.使用反射创建类对象

                Class clazz = Class。forName(classValue);

                //3.创建类对象

                UserService service = clazz.newInstance();

                return service;

            }

         }

4.ioc入门案例

    ·第一步 导入jar包

        ·解压zip文件

            ·lib的jar包

                ·xxx.jar：基本jar包

                ·xxx-javadoc.jar：文档

                ·xxx-sources.jar：源代码

            ·核心jar包：Beans Core Context SpEL

        ·做spring最基本功能的时候，导入四个核心的jar包就可以了。

        ·导入支持日志输出的jar包

    ·第二步 创建类，在类里创建方法

    ·第三步 创建spring配置文件，配置创建类

        ·spring核心配置文件名称和位置不是固定的，建议放在src下，建议名称：

         applicationContext.xml

        ·引入schema约束

        ·eg.：<bean id="user" class="cn.icast.ioc.User"/>

    ·第四步 写代码测试对象创建

        /*

         * 1.加载spirng配置文件，根据配置文件创建对象

         * (1)ClassPathXmlApplicationContext:

         *    前缀classpath：表示的是项目的classpath下相对路径

         *    前缀file 表示的是文件的绝对路径

         *    无前缀默认为classpath下的相对路径

         *    可以同时加载多个文件

         *    可使用通配符

         * (2)FileSystemXmlApplicationContext:

         *    除默认为项目工作路径，即项目的根目录外，其他相同

         *

         */

        ApplicationContext context =

            new ClassPathXmlApplicationContext("classpath:applicationContext.xml");

        // 2.得到配置创建的对象

        User user = (User)context.getBean("user");

    ·配置文件没有提示问题（导入约束）

        window-preferences-XML Catalog-add







三、spring的bean管理

1.bean实例化三种方式

    ·在Spring里面通过配置文件创建对象

    ·bean实例化三种方式实现

        ·使用类的无参数构造创建（重点）

            ·需要有无参的构造方法

            ·<bean id="user" class="cn.icast.ioc.User"/>

        ·使用静态工厂创建

            ·<bean id="bean2" class="cn.icast.bean.Bean2Factory"

                factory-method="getBean2"></bean>

            ·public class Bean2Factory {

                 // 静态的方法，返回Bean2对象

                 public static Bean2 getBean2() {

                     return new Bean2();

                 }

             }



        ·使用实例工厂创建

            ·<bean id="bean3Factory" class="cn.icast.bean.Bean3Factory"></bean>

             <bean id="bean3" factory-bean="bean3Factory"

                factory-method="getBean3"></bean>

            ·public class Bean3Factory {

                 //普通的方法，返回Bean3对象

                 public  Bean3 getBean3() {

                     return new Bean3();

                 }

             }

2.bean标签常用属性

    ·id：起名称，id属性值任意命名。不能包含特殊符号

    ·class：创建对象所在类的全路径

    ·name：功能和id属性一样的，id属性值不能包含特殊符号，但是在name属性值里面可以包含

     特殊符号（遗留问题，为了整合struts1框架，很少用到）

    ·scope

       *·singleton：默认值，单例的（对象只会创建一次）

       *·prototype：多例的

        ·request：web项目中，spring创建一个Bean的对象，将对象存入request域中

        ·session：web项目中，spring创建一个Bean的对象，将对象存入到session域中

        ·globalSession：web项目中，应用在Porlet环境，如果没有Prolet环境那么globalSession相当于

         session



3.属性注入方式介绍

    ·创建对象的时候，为类里面的属性设置值

    ·方式：

        ·方式一 使用set方法注入

         public class User {

             private String name;

             public void setName(String name) {

                 this.name=name;

             }

         }

         ·方式二 有参数构造注入

          public class User {

             private String name;

             public User(String name) {

                 this.name = name;

             }

          }

         ·方式三 使用接口注入

          public interface Dao {

              public void delete (String name);

          }

          public class DaoImpl implements Dao{

             private String name;

             public void delete(String name) {

                 this.name = name;

             }

          }



4.spring注入属性（有参构造和set方法）

    ·在spring框架里面，支持前两种方式，最常使用方式一

    ·set方法

     <bean id="book" class="cn.icast.property.Book">

         <!-- 注入属性值

            name属性值，类里面定义的属性名称

            value属性，设置具体的值

         -->

         <property name="bookname" value="易筋经"></property>

     </bean>

    ·使用有参构造

     <bean id="demo" class="cn.icast.property.PropertyDemo1">

         <!-- 使用有参构造注入 -->

         <constructor-arg name="username" value="小王小马"></constructor-arg>

     </bean>



5.spring注入对象类型属性（重点）

    ·创建service类和dao类

        ·在service得到dao对象

    ·具体实现过程

        ·在service里面把dao作为类型属性

        ·生成dao类型属性的set方法

        ·配置文件中通过set方法注入



6.P 名称空间注入

    ·在一个标签中不能写多个相同名称的属性，但通过名称空间可以表示多个操作

    ·在beans属性中加入p名称空间，并通过p来注入属性

    ·eg.

    <beans xmlns="[http://www.springframework.org/schema/beans"](http://www.springframework.org/schema/beans")

    xmlns:xsi="[http://www.w3.org/2001/XMLSchema-instance"](http://www.w3.org/2001/XMLSchema-instance")

	xmlns:p="[http://www.springframework.org/schema/p"](http://www.springframework.org/schema/p")

    xsi:schemaLocation="[http://www.springframework.org/schema/beans](http://www.springframework.org/schema/beans)

        [http://www.springframework.org/schema/beans/spring-beans.xsd">](http://www.springframework.org/schema/beans/spring-beans.xsd">)

    <bean id="person" class="cn.icast.property.Person" p:pname="lucy"></bean>



7.spring注入复杂数据

    ·数组

    <property name="arrs">

    <list>

        <value>小王</value>

        <value>小马</value>

        <value>小宋</value>

    </list>

</property>

    ·list集合

    <property name="list">

            <list>

                <value>小奥</value>

                <value>小金</value>

                <value>小普</value>

            </list>

        </property>

    ·map集合

    <property name="map">

            <map>

                <entry key="aa" value="lucy"></entry>

                <entry key="bb" value="mary"></entry>

                <entry key="cc" value="tom"></entry>

            </map>

        </property>

    ·properties类型

    <property name="properties">

            <props>

            <!-- prop标签没有value属性 -->

                <prop key="driverclass">com.mysql.jdbc.Driver</prop>

                <prop key="username">pengcheng</prop>

            </props>

        </property>



8.ioc和di区别

    ·IOC：控制反转，把对象创建交给spring进行配置

    ·DI：依赖注入，向类里面的属性中设置值

    ·关系：依赖注入不能单独存在，需要在ioc基础之上完成操作





二、Spring整合web项目原理

1.加载spring核心配置文件

    ·new对象，功能可能实现，效率很低



2.实现思想：把记载配置文件和创建独享过程，在服务器启动时候完成



3.实现原理：

    ·ServletContext对象

    ·监听器

    ·具体使用

        ·在服务器启动的时候，为每个项目创建ServletContext对象

        ·在ServletContext对象创建的时候，使用监听器可以具体到ServletContext对象在什么

         时候创建

        ·使用监听器具坚挺到ServletContext对象创建时候

        ·加载spring配置文件，把配置文件配置对象创建

        ·把创建出来的对象放到ServletContext域对象里面（setAttribute方法）

        ·获取对象的时候，到ServletContext域得到（getAttribute方法）



三、spring的bean管理（注解）

1.什么是注解

    ·代码里面特殊标记，使用注解可以完成功能

    ·注解写法：@注解名称（属性名称=属性值）

    ·注解使用在类上面，方法上面和属性上面



2.开发准备

    (1)导入基本jar包和aop jar包

    (2)创建类，创建方法

    (3)创建spring配置文件，引入约束

        ·第一天做ioc基本功能，引入约束beans

        ·做spring的ioc注解开发，引入新的约束（spring-context约束）



3.使用注解创建对象

·在创建对象的类上面使用注解实现

    ·创建对象有四个注解

        ·@Component（value="user"）相当于<bean id="user" class=""/>

            ·Spring中提供@Component的三个延生注解：（功能上目前来讲是一致的）：

                ·@Controller：WEB层

                ·@Service：业务层

                ·@Repository：持久层

        ·这三个注解是为了让标注类本身的用途清晰，spring在后续版本会对其增强

        ·目前这四个注解功能是一样的，都创建对象

    ·创建对象单实例还是多实例

        ·@Scope(value="prototype")

    ·value可省略如：@Component("user")

    ·使用注解方式不需要set方法



4.使用注解注入属性

    ·创建service类，创建dao类，在service得到dao对象

        @Component(value="userDao")

        public class UserDao {}

            ·@Component(value="userService")

             public class userService {

                 @autowired

                 private UserDao userDao;

             }

            ·@Resource(name="userDao") // 需要javax.annotation包

             public class userService {

             //以下方式均可，也可放于set方法上。

             //  @Resource(name="userDao")

             //  @Autowired@Qualifier("value=userDao")

             //  @Autowired@Qualifier("userDao")

                 @autowired

                 private UserDao userDao;

             }

    ·共同点

        ·两者都可以写在字段和setter方法上。两者如果都写在字段上，那么就不需要再写

         setter方法。

    ·不同点

        ·@Autowired为Spring提供的注解，需要导入包

          org.springframework.beans.factory.annotation.Autowired;

          只按照byType注入。

        ·@Autowired注解是按照类型（byType）装配依赖对象，默认情况下它要求依赖对象必须

         存在，如果允许null值，可以设置它的required属性为false。如果我们想使用按照名

         称（byName）来装配，可以结合@Qualifier注解一起使用。

        ·@Resource默认按照ByName自动注入，由J2EE提供，需要导入包

         javax.annotation.Resource。@Resource有两个重要的属性：name和type，而

         Spring将@Resource注解的name属性解析为bean的名字，而type属性则解析为bean的类

         型。所以，如果使用name属性，则使用byName的自动注入策略，而使用type属性时则使

         用byType自动注入策略。如果既不制定name也不制定type属性，这时将通过反射机制使

         用byName自动注入策略。

    ·注：最好是将@Resource放在setter方法上，因为这样更符合面向对象的思想，通过

     set、get去操作属性，而不是直接去操作属性。

    ·@Resource装配顺序：

        ·如果同时指定了name和type，则从Spring上下文中找到唯一匹配的bean进行装配，找不

         到则抛出异常。

        ·如果指定了name，则从上下文中查找名称（id）匹配的bean进行装配，找不到则抛出异

         常。

        ·如果指定了type，则从上下文中找到类似匹配的唯一bean进行装配，找不到或是找到多

         个，都会抛出异常。

        ·如果既没有指定name，又没有指定type，则自动按照byName方式进行装配；如果没有匹

         配，则回退为一个原始类型进行匹配，如果匹配则自动装配。



    ·@Resource的作用相当于@Autowired，只不过@Autowired按照byType自动注入。



5.xml和注解方式混合使用

    ·创建对象操作使用配置文件方式实现

    ·注入属性的操作使用注解方式实现



四.AOP

1.AOP基础

    ·aop概述

        ·Aspect Oriented Programming，面向切面（方面）编程

        ·AOP采取横向抽取机制，取代了传统纵向继承体系重复代码（性能监视、事务管理、安全检查

         缓存）

    ·aop底层原理

        ·底层使用 动态代理方式实现

        ·横向抽取机制

    ·aop操作相关术语

        ·Joinpoint（连接点）：

            ·所谓连接点是指那些被拦截到的点。在spring中，这些点指的

             是方法，因为spring只支持方法类型的连接点。

            ·类里面可以被增强的方法。

        ·Pointcut（切入点）：

            ·所谓切入点是指我们要对那些Joinpoint进行拦截的定义。

            ·在类里面可以有很多的方法被增强，比如实际操作中，只是增强了类里面的某些方

             法，这些方法被称为切入点。

        ·Advice（通知/增强）：

            ·所谓通知是指拦截到Joinpoint之后所要做的事情。通知分为前置通知，后置通知，

             异常通知，最终通知，环绕通知（切面要完成的功能）。

            ·增强的逻辑，称为增强，比如扩展日志功能，这个日志功能称为增强。

                ·前置通知：在方法之前执行

                ·后置通知：在方法之后执行

                ·异常通知：方法出现异常

                ·最终通知：在后置之后执行

                ·环绕通知：在方法之前和之后执行

        ·Aspect（切面）：

            ·是切入点和通知（引介）的结合。

            ·把增强应用到具体方法也就是切入点上面，过程称为切面

        ·Introduction（引介）：

            ·引介是一种特殊的通知。在不修改类代码的前提下，Introduction可以再运行期为

             类动态地添加一些方法或Field。

        ·Target（目标对象）：

            ·代理的目标对象（要增强的类）

        ·Weaving（织入）：

            ·是把增强引用到目标即把advice引用到target的过程

        ·Proxy（代理）：一个类被AOP织入增强后，就产生一个结果代理类。





2.spring的aop操作

    ·简介

        ·AspectJ是一个面向切面的框架，它扩展了Java语言。AspectJ定义了AOP语法所以它有

         一个专门的编译器用来生成遵守Java字节编码规范的Class文件。

        ·Aspect是一个基于Java语言的AOP框架。

        ·在spring里面进行aop操作，使用AspectJ实现

        ·AspectJ不是spring一部分，和spring一起使用进行aop操作

        ·spring2.0之后才增加的对AspectJ的支持。

    ·使用AspectJ实现aop有两种方式

        ·基于aspectj的xml配置

        ·基于aspectj的注解方式

    ·aop操作准备

        ·除了导入基本的jar包之外，还需要导入aop相关的jar包。

        ·创建spring核心配置文件，导入aop约束

            ·<beans xmlns="[http://www.springframework.org/schema/beans"](http://www.springframework.org/schema/beans")

                xmlns:xsi="[http://www.w3.org/2001/XMLSchema-instance"](http://www.w3.org/2001/XMLSchema-instance")

                xmlns:aop="[http://www.springframework.org/schema/aop"](http://www.springframework.org/schema/aop")

                xsi:schemaLocation="[http://www.springframework.org/schema/beans](http://www.springframework.org/schema/beans)

                [http://www.springframework.org/schema/beans/spring-beans-3.0.xsd](http://www.springframework.org/schema/beans/spring-beans-3.0.xsd)

                [http://www.springframework.org/schema/aop](http://www.springframework.org/schema/aop)

                [http://www.springframework.org/schema/aop/spring-aop.xsd](http://www.springframework.org/schema/aop/spring-aop.xsd)

            ">

    ·使用表达式配置切入点

        ·常用表达式 execution(<访问修饰符>?<返回类型><方法名>(<参数>)<异常>)

            ·execution(* cn.itcast.aop.Book.add(..)) 类中名称为add的方法

                ·*表示所有访问修饰符

                ·两点表示若方法中有参数则参数也被包含

            ·execution(* cn.itcast.aop.Book.*(..)) 匹配指定类中的所有方法

            ·execution(* *.*(..)) 所有类中的所有方法

            ·execution(public *.*(..)) 匹配所有类的public方法

            ·execution(* cn.itcast.dao.*(..)) 匹配指定包下所有类的方法

            ·execution(* cn.itcast.service.UserService.*(..))

             匹配实现特定接口所有类方法

            ·execution(* save*(..))匹配所有save开头的方法

    ·基于aspectj的xml方式

        ·xml

         <!-- 1.配置对象 -->

         <bean id="book" class="cn.itcast.aop.Book"></bean>

         <bean id="myBook" class="cn.itcast.aop.MyBook"></bean>



         <!-- 2.配置aop操作 -->

         <aop:config>

             <!-- 2.1 配置一切入点 -->

             <aop:pointcut expression="execution(* cn.itcast.aop.Book.*(..))"

                    id="pointcut1"/>

             <!-- 2.2 配置切面

                                     把增强用到方法上面

             -->

             <aop:aspect ref="myBook">

                 <!-- 配置增强类型

                     method:增强类里面使用哪个方法作为前置

                  -->

                 <aop:before method="before1" pointcut-ref="pointcut1"/>

                 <aop:after-returning method="after1" pointcut-ref="pointcut1"/>

                 <aop:around method="around1" pointcut-ref="pointcut1"/>

             </aop:aspect>

         </aop:config>

         ·    //环绕通知

          public void around1(ProceedingJoinPoint proceedingJoinPoint)

                throws Throwable {

            //方法之前

            System.out.println("方法之前......");

            //执行被增强的方法

            proceedingJoinPoint.proceed();

            //方法之后

            System.out.println("方法之后......");

          }

    ·基于aspectj的注解aop操作（会用）

        ·创建对象

            ·<bean id="book" class="cn.itcast.aop.Book"></bean>

             <bean id="myBook" class="cn.itcast.aop.MyBook"></bean>

            ·@Component(value="book")

               public class Book {

                   public void add(String string) {

                       System.out.println(string);

                   }

               }

        ·在spring核心配置文件中，开启aop操作

            <aop:aspectj-autoproxy></aop:aspectj-autoproxy>

        ·在增强类上面使用注解完成aop操作

            @Component

            @Aspect

            public class MyBook {

                //在方法上面使用注解完成增强配置

                @Before(value = "execution(* cn.itcast.aop.Book.add(String))")

                public void before1() {

                    System.out.println("before......");

                }

            }





五.log4j

1.log4j介绍

    ·通过log4j可以看到程序运行过程中更详细的信息。

        ·经常使用log4j查0看日志



2.使用

    ·导入log4j的jar包

    ·复制log4j的配置文件，复制到src下面

    ·设置日志级别

        ·六个级别：DEBUG<INFO<WARN<ERROR<FATAL<OFF

         只能输出级别不低于设定级别的日志信息

        ·eg.: log4j.rootLogger=info, stdout





六.spring整合web项目演示

1.演示问题

    ·action调用service，service调用dao

     每次访问的action的时候都会加载spring配置文件



2.解决方案：

    ·在服务器启动的时候创建对象加载配置文件

    ·底层使用监听器，ServletContext对象



3.在spring里面不需要我们自己写代码实现，已经封装好了。

    ·封装了一个监听器，只需要配置监听器就可以了。

    ·配置监听器之前，要导入spring整合web项目jar包(spring-web)

        <listener>

            <listener-class>

                org.springframework.web.context.ContextLoaderListener

            </listener-class>

        </listener>

    ·指定加载spring配置文件位置

        ·默认是寻找web-inf目录下的applicationContext.xml





 七.Spring的JDBCTemplate操作

1.spring框架是一站式框架

    ·针对javaee三层，每一层都有解决技术。

    ·在dao层使用jdbcTemplate。



2.Spring为各种支持的持久化技术，都提供了简单操作的模板和回调

    ORM持久化技术    模板类

    JDBC            org.springframework.jdbc.core.在dao层使用jdbcTemplate

    Hibernate5.0    org.springframework.orm.hibernate5.HibernateTemplate

    IBatis(MyBatis) org.springframework.orm.ibatis.SqlMapClientTemplate

    JPA             org.springframework.orm.jpa.JpaTemplate



3.jdbcTemplate使用和dbutils使用很相似，对数据库进行crud操作

    ·导入jdbcTemplate使用的jar包

    ·创建对象，设置数据库信息

    ·创建jdbcTemplate对象，设置数据库

    ·调用jdbcTemplate对象里面的方法实现

    ·增加

        public void add() {

            //1.创建对象，设置数据库信息

            DriverManagerDataSource dataSource = new DriverManagerDataSource();

            dataSource.setDriverClassName("com.mysql.jdbc.Driver");

            dataSource.setUrl("jdbc:mysql:///spring_day03");

            dataSource.setUsername("root");

            dataSource.setPassword("54pengcheng");

            //2.创建jdbcTemplate对象，设置数据库

            JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);

            //3.调用jdbcTemplate对象里面的方法实现

            String sql = "insert into user values(?,?)";

            int rows = jdbcTemplate.update(sql,"lucy","250");

            System.out.println(rows);

        }

    ·修改

        //1.

        ...

        //2.

        ...

        //3.

        String sql = "update user set password=? where username=?";

        int rows = jdbcTemplate.update(sql, "200", "lucy");

    ·删除

        //1.

        ...

        //2.

        ...

        //3.

        String sql = "insert into user values(?,?)";

        int rows = jdbcTemplate.update(sql,"lucy","250");

    ·查询

        ·查询返回某一个基本数据类型

            ·queryForObject(String sql, Class<T> RequiredType, Object... args)

             : T

            ·//3.调用方法得到记录数

             String sql = "select count(*) from user";

             int count = jdbcTemplate.queryForObject(sql, Integer.class);

        ·查询返回某一个对象

            ·调用方法queryForObject(String sql, RowMapper<T> rowMapper,

             Object... args) : T

                ·第一个参数是sql语句

                ·第二个参数是RowMapper，是一个接口，需要自己写类实现接口，自己对数据

                 实现封装。

                ·第三个参数用来设置sql的参数

            ·//3.

             String sql = "select * from user where username=?";

             User user = jdbcTemplate.queryForObject(sql, new MyRowMapper(),

              "lucy");



             class MyRowMapper implements RowMapper<User> {

                 public User mapRow(ResultSet rs, int num) throws SQLException{

                     //从结果集里面获取数据

                     String username = rs.getString("username");

                     String password = rs.getString("password");

                     //把得到的数据封装到对象里面

                     User user = new User();

                     user.setUsername(username);

                     user.setPassword(password);

                     return user;

                 }

             }

        ·查询返回list集合

            ·query(String sql, RowMapper<T> rowMapper, Object... args) : List<T>

                ·第一个参数是sql语句

                ·第二个参数是RowMapper，是一个接口，需要自己写类实现接口，自己对数据

                 实现封装。

                ·第三个参数用来设置sql的参数

            ·//3.

             String sql = "select * from user";

             List list = jdbcTemplate.query(sql, new MyRowMapper());





八.Spring配置连接池和dao使用jdbcTemplate

1.spring配置c3p0连接池

    ·第一步 导入jar包

        ·c3p0.jar

        ·mchange-commons-java.jar

    ·第二步 创建spring配置文件，配置连接池

        ·原代码：

            ComboPooledDataSource dataSource = new ComboPooledDataSource();

            dataSource.setDriverClass("com.mysql.jdbc.Driver");

            dataSource.setUrl("jsbc:mysql:///spring_day03");

            dataSource.setUser("root");

            dataSource.setPassword("root");

        ·把代码在配置文件中进行配置

    <bean id="dataSource" class="com.mchange.v2.c3p0.ComboPooledDataSource">

        <property name="driverClass" value="com.mysql.jdbc.Driver"></property>

        <property name="jdbcUrl" value="jdbc:mysql:///spring_day03"></property>

        <property name="user" value="root"></property>

        <property name="password" value="54pengcheng"></property>

    </bean>



2.dao使用JdbcTemplate

    ·创建service和dao，配置service和dao对象，并进行注入

     <bean id="userDAO" class="cn.icast.c3p0.UserDAO">

         <property name="jdbcTemplate" ref="jdbcTemplate"></property>

     </bean>

     <bean id="userService" class="cn.icast.c3p0.UserService">

         <property name="userDAO" ref="userDAO"></property>

     </bean>

    ·创建JdbcTemplate对象，将其注入到dao中

     <bean id="jdbcTemplate" class="org.springframework.jdbc.core.JdbcTemplate">

         <property name="dataSource" ref="dataSource"></property>

     </bean>

    ·在jdbcTemplate对象里面注入dataSource





九.Spring的事务管理

1.事务概念

    ·什么是事务

    ·事务的特性：原子性、一致性、隔离性（多个事务之间不会产生影响）、持久性

    ·不考虑隔离性产生读问题：脏读、不可重读、幻读。

    ·解决读问题：设置隔离级别



2.spring进行事务管理api

    ·spring事务管理两种方式：

        ·编程式事务管理（不用）

        ·声明式事务管理

            ·基于xml的配置文件实现

            ·基于注解实现

    ·spring事务管理的api介绍

        ·Spring事务管理高层抽象主要包括3个接口

            ·PlatformTransactionManager 事务管理器

            ·TransactionDefinition 事务定义信息（隔离、传播、超时、只读）

            ·TransactionStatus 事务具体运行状态

        ·spring为不同的持久化框架提供了不同的PlatformTransactionManager接口实现

            ·org.springframework.jdbc.datasource.DataSourceTransactionManager

             使用Spring JDBC或iBatis进行持久化数据时使用

            ·org.springframework.orm.hibernate5.HibernateTransactionManager

             使用Hibernate5.0版本进行持久化数据时使用

            ·org.springframework.orm.jpa.JpaTransactionManager

             使用JPA进行持久化时使用

            ·org.springframework.jdo.JdoTransactionManager

             当持久化机制是Jdo时使用

            ·org.springframework.transaction.jta.JtaTransactionManager

             使用一个JTA实现来管理事务，在一个事务跨越多个资源时必须使用。

    ·无论选择xml还是注解都要首先配置事务管理器



3.搭建转账环境

    ·创建数据库表，添加数据

        id name salary

        1  小王  10000

        2  小马  10000

    ·创建service和dao类，完成注入关系

    ·需求

        小王少1000，小马多1000

    ·产生问题

        ·如果小王少了1000后，出现异常，小马不会多1000，钱丢失了

    ·解决方案

        ·添加事务解决，出现异常进行回滚操作



4.声明式事务管理（xml配置）

    ·配置文件方式使用aop思想配置

    ·第一步 配置事务管理器

     <bean id="transactionManager" class=

        "org.springframework.jdbc.datasource.DataSourceTransactionManager">

         <property name="dataSource" ref="dataSource"></property>

     </bean>

    ·第二步 配置事务增强

     <tx:advice id="txadvice" transaction-manager="transactionManager">

         <!-- 做事务操作 -->

         <tx:attributes>

             <!-- 设置进行事务操作的方法匹配规则 -->

             <tx:method name="account*" propagation="REQUIRED"/>

             <!-- <tx:method name="insert*"/> -->

         </tx:attributes>

     </tx:advice>

    ·第三步 配置切面

     <aop:config>

         <!-- 切入点 -->

         <aop:pointcut expression=

            "execution(* cn.itcast.service.OrdersService.*(..))" id="pointcut1"

         id="pointcut1"/>

         <!-- 切面 -->

         <aop:advisor advice-ref="txadvice" pointcut-ref="pointcut1"/>

     </aop:config>



5.声明式事务管理（注解）

    ·第一步 配置事务管理器

     <bean id="transactionManager" class=

        "org.springframework.jdbc.datasource.DataSourceTransactionManager">

         <property name="dataSource" ref="dataSource"></property>

     </bean>



    ·第二步 开启事务注解

     <tx:annotation-driven transaction-manager="transactionManager"/>



    ·第三步 在要使用事务的方法所在类上面添加注解

     @Transactional

     public class OrdersService {

         ...

     }



> 更新: 2025-07-19 12:46:00  
> 原文: <https://www.yuque.com/viruspc/el3mi0/nrwq0g104c4mv7uh>