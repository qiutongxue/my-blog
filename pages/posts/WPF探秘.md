---
layout: post
author: Berry Qiu
title: WPF/C# 探秘
date: 2020-03-06
description: 做毕设过程中的一些发现
cover: https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220908175238.png
tags: ['WPF', 'C#']
category: 原创
katex: true
---

## 关于MVVM

MVVM 即 Model View ViewModel 的简写。Model 表示一个实体类，与数据库映射。View 即表现层，展示给用户的。 ViewModel 是存在于 View 层和 Model 层中间的一层，对 View 与 Model 之间实现数据绑定，可以是双向的。也就是说，在设计 View 时不需要考虑具体数值的逻辑关系，只要 Bind 就完事了，而开发 ViewModel（通常是面向数据库），就不用考虑界面的设计了。也算是实现了前后端的解耦。

### MVVM Light

MVVM Light 是以 MVVM 设计模式为核心的一套轻量级框架。

主要类：

- `ViewModelLocator` 用来注册、返回 ViewModel 对象。
- `MainViewModel` ： 继承自 `ViewModelBase`
- `ViewModelBase` ： 继承自 `ObservableObject`
- `ObservableObject` ： 实现 `INotifiedPropertyChanged`
  - `RaisePropertyChanged()`

在 Nuget 安装成功 MVVM Light 后，`App.xaml` 中添加了一个静态资源位置：

```xml
<vm:ViewModelLocator x:Key="Locator" d:IsDataSource="True" xmlns:vm="clr-namespace:_3Dprintmonitor.ViewModel" />
```

在 `ViewModelLocator.cs` 中，在构造函数里使用 `SimpleIOC.Default.Register<xxxViewModel>()` 注册自己写好的 ViewModel。并通过 IOC 控制反转返回一个实例对象。

```c#
public MainViewModel Main
{
    get
    {
        return SimpleIoc.Default.GetInstance<MainViewModel>();
    }
}
```

在 View 中即可将 ViewModel 绑定成 DataContext。比如：

```xml
<Window.DataContext>
<Bind Path="Main" Source="{StaticResource Locator}" />
</Window.DataContext>
```

## MaterialDesign

Google 的一个开源 UI 项目，Material Design的风格广泛用于安卓系统，自带icon，有很多样式选择，是一个非常好用的WPF前端框架。

![md](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729143143.png)

> 超级牛啤酒，用就完事了。

## LiveCharts

如何在 LiveChart 中实现图表数据的实时更新？就是要实现 `INotifiedPropertyChanged` 接口。比如我使用 MVVM Light 框架，就是 `ViewModelBase` -> `ObservableObject` -> `INotifiedPropertyChanged`。

> LiveChart 很难保证性能。让 ChartValues存值过多时会很卡，用于静态数据和更新较慢的动态数据还是可行的，对于更新频率高(≤50ms)且数据量庞大的响应来说还是存在很多性能上的不足。
> 
> 替代方案是使用OxyPlot

## C# 连接 MySQL

1. 安装MySQL.Data
2. 配置连接字符串：
   - `data source`
   - `port`
   - `Database`
   - `User Id`
   - `Password`

  ```c#
  var conStr = "data source=127.0.0.1;port=3306;Database=testdb;User Id=root;Password=admin;"
  ```

3. 建立连接-CRUD-关闭连接

  ```c#
  using(MySqlConnection msc = new MySqlConnection(conStr))
    {
        msc.Open();
        var sql = "INSERT INTO measure(temperature,length,width,height) VALUES(@temperature, @length, @width, @height);";
        using (var cmd = new MySqlCommand(sql, msc))
        {
            cmd.Parameters.AddWithValue("@temperature", model.Temperature);
            cmd.Parameters.AddWithValue("@length", model.Length);
            cmd.Parameters.AddWithValue("@width", model.Width);
            cmd.Parameters.AddWithValue("@height", model.Heigth);
            cmd.Prepare();
            cmd.ExecuteNonQuery();
            Console.WriteLine("添加成功！");
        }
        msc.Close();
    }
  ```

## WPF 3D

> 在毕业设计中的问题就是：如何建立椭圆柱体三维模型？
1. 确立椭圆参数方程：
$$
\vec{P} = (x, y, z) = \vec{A}acos\theta + \vec{B}bsin\theta + \vec{C}
$$
2. 建立三维空间点集
3. 按点集绘制三角单元
4. 纹理映射

```c#
/// <summary>
/// 生成椭圆柱体方法
/// </summary>
/// <param name="p1">前椭圆底面中点</param>
/// <param name="p2">后椭圆底面中点</param>
/// <param name="a">椭圆长轴</param>
/// <param name="b">椭圆短轴</param>
/// <param name="startIdx">起始索引</param>
public void GenerateEllipticalCylinder(Point3D p1, Point3D p2, double a, double b, int startIdx)
{

    var foreCenterPoint = new Point3D(p1.X, p1.Y, p1.Z);
    var backCenterPoint = new Point3D(p2.X, p2.Y, p2.Z);

    // 初始点（椭圆中心）
    mesh.Positions.Add(foreCenterPoint);
    mesh.Positions.Add(backCenterPoint);
    mesh.TextureCoordinates.Add(new Point(0, 1));
    mesh.TextureCoordinates.Add(new Point(1, 0));

    for (var i = 0; i <= PRECISENESS; i++)
    {
        double theta = (double)i / PRECISENESS * Math.PI;

        Point3D pos1 = a * A * Math.Cos(theta) + b * B * Math.Sin(theta) + p1;
        Point3D pos2 = a * A * Math.Cos(theta) + b * B * Math.Sin(theta) + p2;

        // 添加前后点
        mesh.Positions.Add(pos1);
        mesh.Positions.Add(pos2);

        // 纹理映射
        mesh.TextureCoordinates.Add(new Point((double)i / PRECISENESS, 0));
        mesh.TextureCoordinates.Add(new Point((double)i / PRECISENESS, 1));

    }

    // 侧面
    for (int i = 0; i < PRECISENESS - 1; i++)
    {

        mesh.TriangleIndices.Add(startIdx + i * 2 + 2);
        mesh.TriangleIndices.Add(startIdx + i * 2 + 1 + 2);
        mesh.TriangleIndices.Add(startIdx + i * 2 + 3 + 2);

        mesh.TriangleIndices.Add(startIdx + i * 2 + 2);
        mesh.TriangleIndices.Add(startIdx + i * 2 + 3 + 2);
        mesh.TriangleIndices.Add(startIdx + i * 2 + 2 + 2);
    }

    // 底面
    for (int i = 0; i < PRECISENESS; i++)
    {
        mesh.TriangleIndices.Add(startIdx);
        mesh.TriangleIndices.Add(startIdx + i * 2 + 2);
        mesh.TriangleIndices.Add(startIdx + i * 2 + 4);

        mesh.TriangleIndices.Add(startIdx + 1);
        mesh.TriangleIndices.Add(startIdx + i * 2 + 5);
        mesh.TriangleIndices.Add(startIdx + i * 2 + 3);
    }


}
```
