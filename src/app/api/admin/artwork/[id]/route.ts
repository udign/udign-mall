import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { put } from '@vercel/blob';
import { getImageUrl, getFileExtension, getFilenameFromUrl } from '@/lib/utils';

// 이미지 파일 저장 함수 (Vercel Blob Storage 사용)
const saveImageFile = async (
  file: { name: string; size: number; type: string; stream: () => ReadableStream },
  itemId: string,
  imageIndex: number,
): Promise<string> => {
  try {
    const extension = getFileExtension(file.name);
    // 업로드 API와 동일한 패스 구조 사용
    const blobPath =
      imageIndex === 0
        ? `item/${itemId}/main.${extension}`
        : `item/${itemId}/sub_${imageIndex}.${extension}`;

    // @ts-expect-error - Node.js 환경에서 File 타입 호환성 문제
    const blob = await put(blobPath, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: true, // 고유한 파일명 생성
    });

    return getFilenameFromUrl(blob.url);
  } catch (error) {
    console.error('Blob upload error:', error);
    throw new Error('파일 업로드에 실패했습니다.');
  }
};

// 작품 정보 조회
export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const rows = await executeQuery(
      `
      SELECT 
        it_id, it_name, it_1, it_2, it_3, it_4, it_price, it_order,
        it_use, it_soldout, it_point, it_point_type, it_supply_point,
        it_stock_qty, it_stock_sms, it_noti_qty, it_buy_min_qty, it_buy_max_qty,
        it_notax, it_sell_email, it_nocoupon, ca_id, ca_id2, ca_id3,
        it_sc_type, it_sc_method, it_sc_price, it_sc_minimum, it_sc_qty,
        it_img1, it_img2, it_img3, it_img4
      FROM g5_shop_item 
      WHERE it_id = ?
    `,
      [id],
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: '작품을 찾을 수 없습니다.' }, { status: 404 });
    }

    const artwork = rows[0] as Record<string, unknown>;

    const optionRows = (await executeQuery(
      `SELECT io_id, io_price, io_stock_qty, io_use, io_no
       FROM g5_shop_item_option 
       WHERE it_id = ? 
       ORDER BY io_type ASC, io_no ASC`,
      [id],
    )) as {
      io_id: string;
      io_price: number;
      io_stock_qty: number;
      io_use: number;
      io_no: number;
    }[];

    // 옵션을 그룹별로 정리
    interface OptionGroup {
      id: string;
      option_name: string;
      items: {
        id: string;
        value: string;
        stock_qty: number;
        price_add: number;
        use_yn: 'Y' | 'N';
      }[];
    }

    const optionGroups: OptionGroup[] = [];
    const groupMap = new Map<string, OptionGroup>();

    for (const option of optionRows) {
      // 옵션 ID를 파싱 (chr(30)으로 구분된 형태)
      const optionParts = option.io_id.split(String.fromCharCode(30));
      const groupName = optionParts[0] || '';
      const optionValue = optionParts[1] || '';

      if (!groupMap.has(groupName)) {
        const newGroup = {
          id: `group_${optionGroups.length}`,
          option_name: groupName,
          items: [],
        };
        groupMap.set(groupName, newGroup);
        optionGroups.push(newGroup);
      }

      const group = groupMap.get(groupName);
      if (group) {
        group.items.push({
          id: `item_${option.io_no}`,
          value: optionValue,
          stock_qty: option.io_stock_qty,
          price_add: option.io_price,
          use_yn: option.io_use === 1 ? 'Y' : 'N',
        });
      }
    }

    // 이미지 URL들을 완전한 URL로 변환
    const artworkWithFullUrls = {
      ...artwork,
      it_img1: getImageUrl(artwork.it_img1 as string | null),
      it_img2: getImageUrl(artwork.it_img2 as string | null),
      it_img3: getImageUrl(artwork.it_img3 as string | null),
      it_img4: getImageUrl(artwork.it_img4 as string | null),
      optionGroups: optionGroups, // 옵션 그룹 추가
    };

    return NextResponse.json(artworkWithFullUrls);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: '작품 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};

// 작품 정보 수정
export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const formData = await request.formData();

    // 기본 폼 데이터 추출
    const it_name = formData.get('it_name') as string;
    const it_1 = formData.get('it_1') as string;
    const it_3 = formData.get('it_3') as string;
    const it_4 = parseInt(formData.get('it_4') as string) || 0;
    const it_price = parseInt(formData.get('it_price') as string) || 0;
    const it_order = parseInt(formData.get('it_order') as string) || 0;
    const it_use = parseInt(formData.get('it_use') as string) || 0;
    const it_soldout = parseInt(formData.get('it_soldout') as string) || 0;
    const it_point = parseInt(formData.get('it_point') as string) || 0;
    const it_point_type = parseInt(formData.get('it_point_type') as string) || 0;
    const it_supply_point = parseInt(formData.get('it_supply_point') as string) || 0;
    const it_stock_qty = parseInt(formData.get('it_stock_qty') as string) || 0;
    const it_stock_sms = parseInt(formData.get('it_stock_sms') as string) || 0;
    const it_noti_qty = parseInt(formData.get('it_noti_qty') as string) || 0;
    const it_buy_min_qty = parseInt(formData.get('it_buy_min_qty') as string) || 0;
    const it_buy_max_qty = parseInt(formData.get('it_buy_max_qty') as string) || 0;
    const it_notax = parseInt(formData.get('it_notax') as string) || 0;
    const it_sell_email = formData.get('it_sell_email') as string;
    const it_nocoupon = parseInt(formData.get('it_nocoupon') as string) || 0;
    const ca_id = formData.get('ca_id') as string;
    const ca_id2 = formData.get('ca_id2') as string;
    const ca_id3 = formData.get('ca_id3') as string;
    const it_sc_type = parseInt(formData.get('it_sc_type') as string) || 0;
    const it_sc_method = parseInt(formData.get('it_sc_method') as string) || 0;
    const it_sc_price = parseInt(formData.get('it_sc_price') as string) || 0;
    const it_sc_minimum = parseInt(formData.get('it_sc_minimum') as string) || 0;
    const it_sc_qty = parseInt(formData.get('it_sc_qty') as string) || 0;

    // 삭제할 이미지 목록
    const imagesToDeleteStr = formData.get('imagesToDelete') as string;
    const imagesToDelete = imagesToDeleteStr ? JSON.parse(imagesToDeleteStr) : [];

    // 입력 값 검증
    if (!it_name?.trim()) {
      return NextResponse.json({ error: '작품명은 필수입니다.' }, { status: 400 });
    }

    if (!ca_id) {
      return NextResponse.json({ error: '기본분류는 필수입니다.' }, { status: 400 });
    }

    // 이미지 파일 처리 - 업로드 API와 동일한 방식 적용
    const imageUpdates: { [key: string]: string } = {};

    // 파일 크기 및 형식 검증
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    for (let i = 1; i <= 4; i++) {
      const imageKey = `it_img${i}`;
      const imageFile = formData.get(imageKey) as File;

      // 새 이미지 파일이 업로드된 경우 - Node.js 환경에서 파일 객체 확인
      if (
        imageFile &&
        typeof imageFile === 'object' &&
        'name' in imageFile &&
        'size' in imageFile &&
        (imageFile as { size: number }).size > 0
      ) {
        const file = imageFile as File;

        // 파일 크기 검증
        if (file.size > maxSize) {
          return NextResponse.json(
            { error: `${imageKey} 파일 용량이 5MB를 초과합니다.` },
            { status: 400 },
          );
        }

        // 파일 형식 검증
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { error: `${imageKey}는 JPG, JPEG, PNG 형식만 허용됩니다.` },
            { status: 400 },
          );
        }

        try {
          const savedFilename = await saveImageFile(file, id, i - 1);
          imageUpdates[imageKey] = savedFilename;
        } catch (error) {
          console.error(`Error saving image ${i}:`, error);
          return NextResponse.json(
            { error: `${imageKey} 파일 업로드에 실패했습니다.` },
            { status: 500 },
          );
        }
      } else if (imagesToDelete.includes(imageKey)) {
        // 이미지 삭제 요청인 경우
        imageUpdates[imageKey] = '';
      }
    }

    // 업데이트할 필드 구성
    const updateFields = [
      'it_name = ?',
      'it_1 = ?',
      'it_3 = ?',
      'it_4 = ?',
      'it_price = ?',
      'it_order = ?',
      'it_use = ?',
      'it_soldout = ?',
      'it_point = ?',
      'it_point_type = ?',
      'it_supply_point = ?',
      'it_stock_qty = ?',
      'it_stock_sms = ?',
      'it_noti_qty = ?',
      'it_buy_min_qty = ?',
      'it_buy_max_qty = ?',
      'it_notax = ?',
      'it_sell_email = ?',
      'it_nocoupon = ?',
      'ca_id = ?',
      'ca_id2 = ?',
      'ca_id3 = ?',
      'it_sc_type = ?',
      'it_sc_method = ?',
      'it_sc_price = ?',
      'it_sc_minimum = ?',
      'it_sc_qty = ?',
    ];

    const updateValues = [
      it_name,
      it_1,
      it_3,
      it_4,
      it_price,
      it_order,
      it_use,
      it_soldout,
      it_point,
      it_point_type,
      it_supply_point,
      it_stock_qty,
      it_stock_sms,
      it_noti_qty,
      it_buy_min_qty,
      it_buy_max_qty,
      it_notax,
      it_sell_email,
      it_nocoupon,
      ca_id,
      ca_id2 || '',
      ca_id3 || '',
      it_sc_type,
      it_sc_method,
      it_sc_price,
      it_sc_minimum,
      it_sc_qty,
    ];

    // 이미지 업데이트 필드 추가
    Object.entries(imageUpdates).forEach(([key, value]) => {
      updateFields.push(`${key} = ?`);
      updateValues.push(value);
    });

    // 작품 정보 업데이트
    const result = await executeQuery(
      `UPDATE g5_shop_item SET ${updateFields.join(', ')} WHERE it_id = ?`,
      [...updateValues, id],
    );

    // @ts-expect-error mysql2 result type doesn't include affectedRows property
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: '작품을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 옵션 그룹 처리
    const optionGroupsStr = formData.get('optionGroups') as string;

    if (optionGroupsStr) {
      try {
        const optionGroups = JSON.parse(optionGroupsStr);

        // 새로운 옵션 추가 (옵션이 있는 경우에만)
        if (optionGroups && Array.isArray(optionGroups) && optionGroups.length > 0) {
          let optionIndex = 0;

          for (const group of optionGroups) {
            if (group.items && group.items.length > 0) {
              for (const item of group.items) {
                if (item.value && item.value.trim()) {
                  // 옵션 ID 생성 (chr(30)으로 구분)
                  const optionId = group.option_name + String.fromCharCode(30) + item.value;

                  await executeQuery(
                    `INSERT INTO g5_shop_item_option 
                     (it_id, io_id, io_type, io_no, io_price, io_stock_qty, io_use) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                      id,
                      optionId,
                      0, // io_type (기본값 0)
                      optionIndex, // io_no (순서)
                      item.price_add || 0,
                      item.stock_qty || 0,
                      item.use_yn === 'Y' ? 1 : 0,
                    ],
                  );

                  optionIndex++;
                }
              }
            }
          }
        }
      } catch (optionError) {
        console.error('옵션 처리 오류:', optionError);
        // 옵션 처리 실패해도 작품 정보는 성공적으로 저장된 상태이므로 경고만 표시
      }
    }

    return NextResponse.json({
      message: '작품 정보가 성공적으로 수정되었습니다.',
      success: true,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: '작품 정보 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
};
