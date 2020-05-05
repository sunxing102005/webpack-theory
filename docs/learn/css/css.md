### 怎么让一个div水平垂直居中
01.display:table-cell
``` html
<div class="wrap">
     <div class="center"></div>
</div>
```
```css
.wrap{
    width: 200px;
    height: 200px;
    background: yellow;
    display: table-cell;
    vertical-align: middle;
    text-align: center;
}
.center{
    display: inline-block;
    vertical-align: middle;
    width: 100px;
    height: 100px;
    background: green;
}

```
外层div display设为table-cell,并且设置vertical-align，text-align。
内部div须设置display为inline-block，否则不会水平居中。
02.flex布局 + justify-content，align-items
```css
.wrap {
    background: yellow;
    width: 200px;
    height: 200px;
    display: flex; 
    align-items: center; 
    justify-content: center;
}

.center {
    background: green;
    width: 100px;
    height: 100px;
}
```
外层设置flex布局，并且主轴与交叉轴都是中间对齐。

03.flex + margin

```css
.wrap {
    background: yellow;
    width: 200px;
    height: 200px;
    display: flex; 
}

.center {
    background: green;
    width: 100px;
    height: 100px;
    margin: auto;
}

```
外层flex布局，内层margin设为0.