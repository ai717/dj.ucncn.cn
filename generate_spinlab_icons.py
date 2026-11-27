import math
import os
from PIL import Image, ImageDraw

def render_spinlab_icon(size):
    # 使用 4x 超采样绘制以保证极致平滑抗锯齿
    scale = 4
    canvas_size = size * scale
    img = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center = canvas_size / 2.0
    r_outer = canvas_size * 0.46

    # 1. 唱盘外圈机身底座
    platter_box = [center - r_outer, center - r_outer, center + r_outer, center + r_outer]
    draw.ellipse(platter_box, fill=(18, 20, 28, 255), outline=(0, 240, 255, 230), width=max(2, int(scale * 2.2)))

    # 2. 黑胶唱片同心音轨圈 (Vinyl Grooves)
    for ratio, alpha in [(0.41, 70), (0.36, 90), (0.31, 80), (0.26, 60)]:
        r_g = canvas_size * ratio
        draw.ellipse(
            [center - r_g, center - r_g, center + r_g, center + r_g],
            outline=(60, 68, 92, alpha),
            width=max(1, int(scale * 1.2))
        )

    # 3. 动态高光光泽（黑胶特有的扇形反光）
    sheen_layer = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    sheen_draw = ImageDraw.Draw(sheen_layer)
    sheen_draw.pieslice(platter_box, start=310, end=355, fill=(255, 255, 255, 30))
    sheen_draw.pieslice(platter_box, start=130, end=175, fill=(255, 255, 255, 30))
    img = Image.alpha_composite(img, sheen_layer)
    draw = ImageDraw.Draw(img)

    # 4. 中心彩色标签盘 (Dual gradient cyan-pink vibe)
    r_label = canvas_size * 0.20
    label_box = [center - r_label, center - r_label, center + r_label, center + r_label]
    
    # 模拟渐变标签 (左侧青蓝 0, 240, 255 -> 右侧霓虹粉 255, 51, 102)
    label_img = Image.new('RGBA', (int(r_label * 2), int(r_label * 2)), (0, 0, 0, 0))
    l_draw = ImageDraw.Draw(label_img)
    l_w = int(r_label * 2)
    for x in range(l_w):
        t = x / float(l_w)
        r = int(0 * (1 - t) + 255 * t)
        g = int(240 * (1 - t) + 51 * t)
        b = int(255 * (1 - t) + 102 * t)
        l_draw.line([(x, 0), (x, l_w)], fill=(r, g, b, 255))
    
    # 制作圆形遮罩
    mask = Image.new('L', (l_w, l_w), 0)
    m_draw = ImageDraw.Draw(mask)
    m_draw.ellipse([0, 0, l_w, l_w], fill=255)
    
    label_pos = (int(center - r_label), int(center - r_label))
    img.paste(label_img, label_pos, mask)
    draw = ImageDraw.Draw(img)
    
    # 标签外描边
    draw.ellipse(label_box, outline=(255, 255, 255, 200), width=max(1, int(scale * 1.5)))

    # 5. 中心经典 SpinLab "S" 曲线与黑胶主轴孔
    r_core = canvas_size * 0.05
    core_box = [center - r_core, center - r_core, center + r_core, center + r_core]
    draw.ellipse(core_box, fill=(14, 15, 20, 255), outline=(255, 255, 255, 240), width=max(1, int(scale * 1.2)))

    # 降采样回目标尺寸以获得平滑抗锯齿
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    print("Generating SpinLab icons in:", base_dir)

    # 1. Favicon 16x16, 32x32, 48x48
    img16 = render_spinlab_icon(16)
    img32 = render_spinlab_icon(32)
    img48 = render_spinlab_icon(48)
    img180 = render_spinlab_icon(180)
    img192 = render_spinlab_icon(192)
    img512 = render_spinlab_icon(512)

    img16.save(os.path.join(base_dir, 'favicon-16x16.png'), 'PNG')
    img32.save(os.path.join(base_dir, 'favicon-32x32.png'), 'PNG')
    img180.save(os.path.join(base_dir, 'apple-touch-icon.png'), 'PNG')
    img192.save(os.path.join(base_dir, 'icon-192.png'), 'PNG')
    img512.save(os.path.join(base_dir, 'icon-512.png'), 'PNG')

    # ICO format with multiple embedded resolutions
    ico_path = os.path.join(base_dir, 'favicon.ico')
    img48.save(
        ico_path,
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48)]
    )
    print("All SpinLab icons generated successfully!")

if __name__ == '__main__':
    main()
