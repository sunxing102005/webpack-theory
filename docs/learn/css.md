### flex布局
#### 容器属性
##### flex-direction
flex-direction属性决定主轴的方向
```css
.box {
  flex-direction: row | row-reverse | column | column-reverse;
}
```
##### flex-wrap
flex-wrap属性定义，如果一条轴线排不下，如何换行。
```css
.box{
  flex-wrap: nowrap | wrap | wrap-reverse;
}
```
##### flex-flow
flex-flow属性是flex-direction属性和flex-wrap属性的简写形式，默认值为row nowrap。
```css
.box {
  flex-flow: <flex-direction> || <flex-wrap>;
}

```
##### justify-content
justify-content属性定义了项目在主轴上的对齐方式。
```css
.box {
  justify-content: flex-start | flex-end | center | space-between | space-around;
}
```
##### align-items
align-items属性定义项目在交叉轴上如何对齐。
```css
.box {
  align-items: flex-start | flex-end | center | baseline | stretch;
}
```
##### align content
align-content属性定义了多根轴线的对齐方式。如果项目只有一根轴线，该属性不起作用。
```css
.box {
  align-content: flex-start | flex-end | center | space-between | space-around | stretch;
}
```
#### 项目属性

##### order
定义项目排列顺序，数字越小越靠前。
##### flex-grow
flex-grow属性定义项目的放大比例，默认为0，即如果存在剩余空间，也不放大。
如果所有项目的flex-grow属性都为1，则它们将等分剩余空间（如果有的话）。如果一个项目的flex-grow属性为2，其他项目都为1，则前者占据的剩余空间将比其他项多一倍。
##### flex-shrink
flex-shrink属性定义了项目的缩小比例，默认为1，即如果空间不足，该项目将缩小。

如果所有项目的flex-shrink属性都为1，当空间不足时，都将等比例缩小。如果一个项目的flex-shrink属性为0，其他项目都为1，则空间不足时，前者不缩小。
##### flex-basis
flex-basis属性定义了在分配多余空间之前，项目占据的主轴空间（main size）。浏览器根据这个属性，计算主轴是否有多余空间。它的默认值为auto，即项目的本来大小。

##### flex
flex属性是flex-grow, flex-shrink 和 flex-basis的简写，默认值为0 1 auto。后两个属性可选。
```css
.item {
  flex: none | [ <'flex-grow'> <'flex-shrink'>? || <'flex-basis'> ]
}
```
该属性有两个快捷值：auto (1 1 auto) 和 none (0 0 auto)。

当flex取值为单值时：
有单位，则设置flex-basis
无单位，则设置flex-grow
当flex取双值时：
有单位， flex-grow & flex-basis
无单位， flex-grow & flex-shrink

### 水平垂直居中
```html
<div class = 'wrapper'>
<div class = 'inner'></div>
</div>

```
#### flex布局

```css
.wrapper{
    display:flex;
    align-items: center;
    justify-content:center; 
    width:200px;
    height:200px;
}
.inner{

}
```
简易版：
```css
.wrapper{
    display:flex;
    align-items: center;
    justify-content:center; // 主轴
    width:200px;
    height:200px;
}
.inner{
    margin:auto;
}
```
#### absolute+margin ，用于内部高宽已知
解法1:
```css
.wrapper{
    width:200px;
    height:200px;
    position:relative;

}
.inner{
    width:100px;
    height:100px;
    position:absolute;
    left:0;
    right:0;
    top:0;
    bottom:0;
    margin:auto;
}
```
left,top,bottom,right不需要一定为0，相等就行。

解法2:
```css
.wrapper{
    width:200px;
    height:200px;
    position:relative;
}
.inner{
    width:100px;
    height:100px;
    position:absolute;
    left:50%;
    top:50%;
    margin-left: -50px;
    margin-top:-50px;
}
```

#### absolute+transform ,用于高度未知

```css
.wrapper{
    width:200px;
    height:200px;
    position:relative;
}
.inner{
    position:absolute;
    left:50%;
    top:50%;
    transform:translate(-50%,-50%);
}
```
#### 分别实现水平垂直居中
基础代码
```html
<div class="md-warp">
    <span class="md-main"></span>
</div>
```
```css
.md-warp{
    width: 400px;
    height: 300px;
    max-width: 100%;
    border: 1px solid #000;
}
.md-main{
    display: block;
    width: 100px;
    height: 100px;
    background: #f00;
}
```
##### 水平居中
1.margin法
条件：
* 元素定宽
* 是块级元素
* margin-left,margin-right 设置为auto。
```css
.md-main{
    margin: 0 auto;
}
```
2.定位法
条件:
* 元素定宽
* 绝对定位，left 50%。
* 元素负左边距margin-left为宽度的一半
```css
.md-warp{
    position: relative;
}
.md-main{
    position: absolute;
    left: 50%;
    margin-left: -50px;
}
```
如果宽度不固定
```css
.md-warp{
    position: relative;
}
// 注意此时md-main不设置width为100px
.md-main{
    position: absolute;
    left: 50%;
    -webkit-transform: translate(-50%,0);
    -ms-transform: translate(-50%,0);
    -o-transform: translate(-50%,0);
    transform: translate(-50%,0);
}
```
3.文字居中
对于单行文字，可以使用text-align:center。多行文字可以参考margin和定位法。
4.flex
* 设置justify-content: center;
##### 垂直居中
1.定位法
和水平居中类似，只是把left:50%换成了top:50%，负边距和transform属性进行对应更改即可。
```css
.md-warp{
    position: relative;
}
.md-main{
    position: absolute;
    /* 核心 */
    top: 50%;
    margin-top: -50px;
}
```
2.单行文本垂直居中
条件：
* 元素内容是单行，并且其高度是固定不变的。
* 将其line-height设置成和height的值一样。
3.绝对定位垂直居中
```css
.md-warp{
  position: relative;
}
.md-main{
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    margin: auto;
}
```
4.flex
* 设置align-items: center;

5.absolute+margin
```css
.md-warp{
  position: relative;
}
.md-main{
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    margin: auto;
}
```
### 三栏布局
左右固定，中间自适应
#### flex
```html
<div class="container">
    <div class="left">left</div>
    <div class="main">main</div>
    <div class="right">right</div>
</div>

```
```css
.container{
    height:200px;
    width:200px;
    display:flex;

}
.left,.right{
    flex-basis:50px;
}
.main{
    flex:1;
}
```

#### absolute+margin

```html
<div class="container">
    <div class="left">left</div>
    <div class="main">main</div>
    <div class="right">right</div>
</div>
```
```css
.container{
    position:relative;
    height:500px;
    width:500px;
    
}
.left,.right{
    top:0;
    width:200px;
    position:absolute;
}
.left{
    left:0;
}
.right{
    right:0;
}
.main{
    margin:0 200px;
}
```

#### float+margin
```html
<div class="container">
    <div class="left">left</div>
    <div class="main">main</div>
    <div class="right">right</div>
</div>
```
```css
.left{
    float:left;
    width:200px;
    background:red;
}
.main{
    margin:0 200px;
    background: green;
}
.right{
    float:right;
    width:200px;
    background:red;
}
```

### css权重计算
!important>行内样式>id选择器>类选择器>元素选择器>通配符
各选择器权限，二进制值：
* 内联样式：1000；
* id选择器：0100；
* 类/伪类，属性选择器：0010；
* 元素，伪元素选择器：0001；
* 通配符，子选择器：0000
* 继承没有权重

比较方式：
层级相同，继续比较权重，层级不同，则层极高一定权重大，不论低层级选择器有多少。

### BFC
Block Formatting Context 块级格式化上下文。
创建BFC：
* 浮动元素，float不等于none
* 绝对定位，position等于fixed,absolute；
* display等于flex，table-cell,inline-block,table等；
* overflow不等于visible。

布局规则：
1.	内部box会在垂直方向上，一个一个放置。
2.	Box垂直方向的距离由margin决定，属于同一bfc的两个相邻box会发声重叠。
3.	每个元素 margin-box 左边，与包含元素的border box 左边相接触
4.	Bfc区域不会与float box重叠
5.	Bfc是独立容器，里面子元素不会受外面元素影响
6.	计算bfc高度时，里面浮动元素也参与计算

BFC解决问题：
1.不和浮动元素重叠
由于bfc不与float blox重叠，可以实现两列自适应布局。
```html
<style>
    body {
        width: 300px;
        position: relative;
    }

    .aside {
        width: 100px;
        height: 150px;
        float: left;
        background: #f66;
    }

    .main {
        height: 200px;
        background: #fcc;
        overflow:hidden;
    }
</style>
<body>
    <div class="aside"></div>
    <div class="main"></div>
</body>

```
![e6afae2820c97c3ee19395f74a7b3239.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p36)

2.防止margin重叠。
现象1，父子元素重叠：
![c7316aaf2f796f83fdc045fa540199d3.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p40)

现象2，同级元素margin重叠：
![b3ddd00cc418951d647a80e13490692c.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p42)

解决方法：
01.父子元素重叠，给父元素设置bfc布局。
02.同级重叠，将两个元素都设为bfc布局。

3.清除浮动。
清除浮动主要是为了防止父元素塌陷。
```html
<style>
    .par {
        border: 5px solid #fcc;
        width: 300px;
    }

    .child {
        border: 5px solid #f66;
        width:100px;
        height: 100px;
        float: left;
    }
</style>
<body>
    <div class="par">
        <div class="child"></div>
        <div class="child"></div>
    </div>
</body>

```
![ff8adaf4af9556a922646acae61c5c16.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p43)
为达到清除内部浮动，我们可以触发par生成BFC，那么par在计算高度时，par内部的浮动元素child也会参与计算。
```css
.par{
  overflow:hidden
}
```
![dcbdacc23d07e12098bb270ba034f269.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p44)

清除浮动其他方法：
01.子元素末尾添加新元素，应用clear:both
```html
<div class="outer">
    <div class="div1">1</div>
    <div class="div2">2</div>
    <div class="div3">3</div>
    <div class="clear"></div>
</div>
```
```css
.clear{clear:both; height: 0; line-height: 0; font-size: 0}
```
2.父元素添加伪元素
```html
<div class="outer clearfix">
    <div class="inner">inner</div>
</div>
<style>
.outer{
    background: blue;
}
.inner{
    width: 100px;
    height: 100px;
    background: red;
    float: left;
}
.clearfix:after{
    content: "";
    display: block;
    height: 0;
    clear:both;
    visibility: hidden;
}
</style>
```

### position
* absolute 绝对定位，相对于 static 定位以外的第一个父元素进行定位。
* relative 相对定位，相对于其自身正常位置进行定位。
* fixed 固定定位，相对于浏览器窗口进行定位。
* static 默认值。没有定位，元素出现在正常的流中。
* inherit 规定应该从父元素继承 position 属性的值。

注意absolute定位是相对于第一个不是static的父元素的padding定位。

### css实现自适应正方形
#### css3 vw单位
* vw:相对于视口宽度百分比的单位。
* vh：相对于视口高度百分比的单位。
* vmax:相对当前视口宽高中 较大 的一个的百分比单位。
* vmin：相对当前视口宽高中 较小 的一个的百分比单位。

```
<div class="placeholder"></div>  

.placeholder {
  width: 100%;
  height: 100vw;
}
```

#### 垂直方向设置padding撑开容器
原理：margin,padding的百分比值是根据父元素的width计算的。
```css
.placeholder {
  width: 100%;
  padding-bottom: 100%;
}
```
这时如果设置内容，高度会溢出，所以
```css
.placeholder {
  height: 0;
}
```
#### 利用伪元素margin/padding-top撑开容器
上一种方法，设置max-height会无效。
```css
.placeholder {
  width: 100%;
}

.placeholder:after {
  content: '';
  display: block;
  margin-top: 100%; /* margin 百分比相对父元素宽度计算 */
}
```
直接设置伪元素margin-top后发现，页面什么都没有，这是由于容器与伪元素在垂直方向上发生margin折叠。这时可以通过bfc避免折叠。
```css
.placeholder {
  overflow: hidden;
}
```
注：如果使用padding-top则不会重叠。

### css实现三角形
```css
.triangle{
   border-left: 70px solid transparent;
    border-right: 20px solid transparent;
    border-bottom: 30px solid black;
    width: 0;
    height: 0;
 }
```
顶点在top。
![0b53f7fd791a8ea58d371ff82b0ffa50.png](evernotecid://AEB4F5B5-0496-45C8-A67F-414847E50655/appyinxiangcom/25152521/ENResource/p45)

